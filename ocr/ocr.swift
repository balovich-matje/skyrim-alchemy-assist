// Tiny OCR helper using Apple's Vision framework.
// Usage: ocr <image-path>   -> prints JSON: {"width":W,"height":H,"lines":[{"text":..,"x":..,"y":..,"w":..,"h":..,"conf":..}]}
// Coordinates are in pixels, origin top-left.
import Foundation
import Vision
import AppKit

func fail(_ msg: String) -> Never {
    FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
    exit(1)
}

guard CommandLine.arguments.count >= 2 else { fail("usage: ocr <image>") }
let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { fail("cannot read image: \(path)") }

let W = Double(cg.width), H = Double(cg.height)
var out: [[String: Any]] = []

let req = VNRecognizeTextRequest { request, error in
    if let error = error { fail("vision error: \(error)") }
    for obs in (request.results as? [VNRecognizedTextObservation]) ?? [] {
        guard let top = obs.topCandidates(1).first else { continue }
        let b = obs.boundingBox
        out.append([
            "text": top.string,
            "conf": Double(top.confidence),
            "x": b.minX * W,
            "y": (1 - b.maxY) * H,
            "w": b.width * W,
            "h": b.height * H,
        ])
    }
}
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
req.recognitionLanguages = ["en-US"]
req.minimumTextHeight = 0.008

let handler = VNImageRequestHandler(cgImage: cg, options: [:])
do { try handler.perform([req]) } catch { fail("vision failed: \(error)") }

let result: [String: Any] = ["width": W, "height": H, "lines": out]
let data = try! JSONSerialization.data(withJSONObject: result, options: [])
FileHandle.standardOutput.write(data)
