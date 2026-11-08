#!/usr/bin/env python3
"""Skyrim Alchemy Assist - local server.

Serves the web UI from ./public, runs OCR on uploaded screenshots with the
macOS Vision helper in ./ocr, and persists app state to ./data/state.json.

    python3 server.py [--port 8765] [--lan] [--no-browser]

--lan       listen on all interfaces so other devices on your network can use it
--no-browser  don't open a browser tab on start
"""
import argparse
import json
import os
import socket
import subprocess
import sys
import tempfile
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(ROOT, "public")
DATA_DIR = os.path.join(ROOT, "data")
STATE_FILE = os.path.join(DATA_DIR, "state.json")
OCR_SRC = os.path.join(ROOT, "ocr", "ocr.swift")
OCR_BIN = os.path.join(ROOT, "ocr", "ocr-bin")
MAX_UPLOAD = 40 * 1024 * 1024

state_lock = threading.Lock()


def ensure_ocr():
    """Compile the Vision OCR helper if needed. Returns True if it is usable."""
    if sys.platform != "darwin":
        return False
    fresh = os.path.exists(OCR_BIN) and os.path.getmtime(OCR_BIN) >= os.path.getmtime(OCR_SRC)
    if fresh:
        return True
    print("Compiling OCR helper (one-time, ~15s)...", flush=True)
    try:
        subprocess.run(["swiftc", "-O", OCR_SRC, "-o", OCR_BIN], check=True,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300)
        return True
    except (OSError, subprocess.SubprocessError) as e:
        print("Could not compile the OCR helper (install Xcode Command Line Tools: "
              "xcode-select --install). Falling back to in-browser OCR.\n", e, flush=True)
        return False


class Handler(SimpleHTTPRequestHandler):
    server_version = "SkyrimAlchemyAssist/1.0"

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=PUBLIC, **kw)

    def log_message(self, fmt, *args):
        if "/api/" in (self.path or ""):
            sys.stderr.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # ---- helpers ----
    def _json(self, obj, code=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_UPLOAD:
            raise ValueError("upload too large")
        return self.rfile.read(n) if n else b""

    # ---- routes ----
    def do_GET(self):
        if self.path == "/api/health":
            return self._json({"ok": True, "ocr": "vision" if self.server.ocr_ok else "none"})
        if self.path == "/api/state":
            with state_lock:
                try:
                    with open(STATE_FILE, encoding="utf-8") as f:
                        return self._json(json.load(f))
                except (OSError, ValueError):
                    return self._json({})
        return super().do_GET()

    def do_PUT(self):
        if self.path != "/api/state":
            return self._json({"error": "not found"}, 404)
        try:
            data = json.loads(self._body() or b"{}")
        except ValueError:
            return self._json({"error": "bad json"}, 400)
        with state_lock:
            os.makedirs(DATA_DIR, exist_ok=True)
            tmp = STATE_FILE + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f)
            os.replace(tmp, STATE_FILE)
        return self._json({"ok": True})

    def do_POST(self):
        if self.path == "/api/ocr":
            return self._ocr()
        if self.path == "/api/shutdown":
            self._json({"ok": True})
            print("\nShutdown requested from the web UI. Bye!", flush=True)
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return
        return self._json({"error": "not found"}, 404)

    def _ocr(self):
        if not self.server.ocr_ok:
            return self._json({"error": "server OCR unavailable"}, 501)
        try:
            img = self._body()
        except ValueError as e:
            return self._json({"error": str(e)}, 413)
        if not img:
            return self._json({"error": "empty upload"}, 400)
        fd, path = tempfile.mkstemp(prefix="alch-", suffix=".img")
        try:
            with os.fdopen(fd, "wb") as f:
                f.write(img)
            p = subprocess.run([OCR_BIN, path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
            if p.returncode != 0:
                return self._json({"error": p.stderr.decode("utf-8", "replace").strip() or "OCR failed"}, 422)
            body = p.stdout
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except subprocess.TimeoutExpired:
            return self._json({"error": "OCR timed out"}, 504)
        finally:
            try:
                os.unlink(path)
            except OSError:
                pass


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--lan", action="store_true", help="listen on all network interfaces")
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()

    host = "0.0.0.0" if args.lan else "127.0.0.1"
    httpd = None
    for port in range(args.port, args.port + 20):
        try:
            httpd = ThreadingHTTPServer((host, port), Handler)
            break
        except OSError:
            continue
    if httpd is None:
        sys.exit("No free port found near %d" % args.port)

    httpd.ocr_ok = ensure_ocr()
    port = httpd.server_address[1]
    url = "http://localhost:%d/" % port
    print("=" * 60)
    print(" Skyrim Alchemy Assist is running")
    print(" Open: %s" % url)
    if args.lan and lan_ip():
        print(" On your network: http://%s:%d/" % (lan_ip(), port))
    print(" OCR engine: %s" % ("macOS Vision" if httpd.ocr_ok else "in-browser (Tesseract.js)"))
    print(" Stop it with the 'Shut down server' button or Ctrl+C here.")
    print("=" * 60, flush=True)
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
