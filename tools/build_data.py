#!/usr/bin/env python3
"""Rebuild public/data.js from the UESP "Skyrim:Alchemy Effects" page.

Usage:  python3 tools/build_data.py [path/to/effects_raw.txt]
If no path is given the page is downloaded from en.uesp.net.
"""
import json, re, sys, os, urllib.request, urllib.parse

URL = "https://en.uesp.net/w/index.php?title=Skyrim:Alchemy_Effects&action=raw"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "data.js")

def load():
    if len(sys.argv) > 1:
        return open(sys.argv[1], encoding="utf-8").read()
    req = urllib.request.Request(URL, headers={"User-Agent": "skyrim-alchemy-assist/1.0"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8")

def num(s):
    s = re.sub(r"<[^>]+>|'''|''|\{\{[^}]*\}\}", "", s).strip()
    m = re.search(r"-?\d+(\.\d+)?", s)
    return float(m.group(0)) if m else 0.0

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "skyrim-alchemy-assist/1.0"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8")


def supplement(effects, ingredients):
    """Add ingredients missing from the effects page (e.g. Fishing creation) using their own pages."""
    api = "https://en.uesp.net/w/api.php?action=query&list=categorymembers&cmlimit=500&format=json&cmtitle=Category:"
    eidx = {e["name"].lower(): i for i, e in enumerate(effects)}
    try:
        titles = set()
        for cat in ("Skyrim-Ingredients", "Skyrim-Creation_Club-Ingredients"):
            d = json.loads(fetch(api + cat))
            titles |= {m["title"].split(":", 1)[1] for m in d["query"]["categorymembers"] if m["ns"] == 134}
    except Exception as e:  # offline: skip
        print("supplement skipped:", e, file=sys.stderr)
        return
    for t in sorted(titles - set(ingredients)):
        try:
            raw = fetch("https://en.uesp.net/w/index.php?action=raw&title=Skyrim:" + urllib.parse.quote(t.replace(" ", "_")))
        except Exception as e:
            print("  skip", t, e, file=sys.stderr); continue
        if "{{Ingredient Summary" not in raw:
            continue
        effs = [re.sub(r"\s*\(effect\)", "", x).strip() for x in re.findall(r"\|eff\d=([^\n|]+)", raw)]
        idxs = [eidx.get(x.lower()) for x in effs]
        if len(idxs) != 4 or None in idxs:
            print("  skip", t, effs, file=sys.stderr); continue
        mod = re.search(r"\|mod=\[\[[^|\]]+\|([^\]]+)\]\]", raw)
        ingredients[t] = {"name": t, "source": ("CC: " + mod.group(1)) if mod else "other",
                          "effects": [{"e": i, "p": 99} for i in idxs]}
        print("  + added", t, effs, file=sys.stderr)


def main():
    text = load()
    start = text.index("==Effect List==")
    body = text[start:]
    blocks = re.split(r"\n\|-\s*\n", body)
    effects, ingredients = [], {}
    for b in blocks:
        lines = [l for l in b.split("\n") if l.strip()]
        hdr = next((l for l in lines if l.startswith('!class="Effect')), None)
        if not hdr:
            continue
        harmful = "EffectNeg" in hdr
        m = re.search(r"\[\[Skyrim:[^|\]]+\|([^\]]+)\]\]", hdr)
        name = m.group(1).strip()
        stat = next(l for l in reversed(lines) if l.startswith("|") and "||" in l)
        cells = [c for c in stat[1:].split("||")]
        cost = num(cells[0]); mag = num(cells[1]); dur = num(cells[2])
        varies = "duration" if "EffectPos" in cells[2] else "magnitude"
        eff_index = len(effects)
        effects.append({"name": name, "cost": cost, "mag": mag, "dur": dur,
                        "harmful": harmful, "varies": varies})
        prio = 0
        for l in lines:
            if not re.match(r"^(''')?\[\[Skyrim:", l.strip()):
                continue
            im = re.search(r"\[\[Skyrim:[^|\]]+\|([^\]]+)\]\]", l)
            if not im:
                continue
            iname = im.group(1).strip()
            mults = dict(re.findall(r"\{\{Effect Mult\|(mag|dur|val)\|([\d.]+)\}\}", l))
            src = "base"
            if "{{DG}}" in l: src = "Dawnguard"
            elif "{{DB}}" in l: src = "Dragonborn"
            elif "{{HF}}" in l: src = "Hearthfire"
            else:
                cm = re.search(r"\{\{CC\|([^}]+)\}\}", l)
                if cm: src = "CC: " + cm.group(1)
            magM = float(mults.get("mag", 1)); durM = float(mults.get("dur", 1))
            valM = float(mults.get("val", 0)) or None
            hidden = 1.0
            if valM:
                df = lambda x: x / 10 if x > 0 else 1
                expected = (magM * df(dur * durM) / df(dur)) ** 1.1
                hidden = valM / expected
                if abs(hidden - 1) < 0.06: hidden = 1.0
            ing = ingredients.setdefault(iname, {"name": iname, "source": src, "effects": []})
            if src != "base" and ing["source"] == "base": ing["source"] = src
            e = {"e": eff_index, "p": prio}
            if magM != 1: e["m"] = magM
            if durM != 1: e["d"] = durM
            if hidden != 1: e["h"] = round(hidden, 3)
            ing["effects"].append(e)
            prio += 1
    supplement(effects, ingredients)
    bad = [i["name"] for i in ingredients.values() if len(i["effects"]) != 4]
    if bad:
        print("WARNING ingredients without exactly 4 effects:", bad, file=sys.stderr)
    data = {"effects": effects, "ingredients": sorted(ingredients.values(), key=lambda x: x["name"])}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// Generated by tools/build_data.py from UESP Skyrim:Alchemy_Effects. Do not edit by hand.\n")
        f.write("window.ALCHEMY_DATA = ")
        json.dump(data, f, separators=(",", ":"))
        f.write(";\n")
    print(f"{len(effects)} effects, {len(ingredients)} ingredients -> {os.path.normpath(OUT)}")

if __name__ == "__main__":
    main()
