import Foundation
import AppKit

// bitmap <in.png> <out.txt> <targetWidth> <threshold 0-255>
let a = CommandLine.arguments
guard let img = NSImage(contentsOfFile: a[1]), let tiff = img.tiffRepresentation,
      let src = NSBitmapImageRep(data: tiff) else { FileHandle.standardError.write("load fail\n".data(using:.utf8)!); exit(1) }
let tw = Int(a[3])!, thr = Int(a[4])!
let sw = src.pixelsWide, sh = src.pixelsHigh
let th = Int(Double(sh) * Double(tw) / Double(sw))

// downsample by box-average — averages engraving hatch into grey so a threshold keeps only real lines
var rows: [String] = []
let bx = Double(sw) / Double(tw), by = Double(sh) / Double(th)
for y in 0..<th {
    var line = ""
    for x in 0..<tw {
        var sum = 0.0, n = 0.0
        let x0 = Int(Double(x)*bx), x1 = max(x0+1, Int(Double(x+1)*bx))
        let y0 = Int(Double(y)*by), y1 = max(y0+1, Int(Double(y+1)*by))
        for yy in y0..<min(y1, sh) { for xx in x0..<min(x1, sw) {
            guard let c = src.colorAt(x: xx, y: yy) else { continue }
            sum += Double(c.brightnessComponent) * 255.0; n += 1
        } }
        let v = n > 0 ? sum/n : 255
        line += v < Double(thr) ? "1" : "0"
    }
    rows.append(line)
}
try! (String(tw) + " " + String(th) + "\n" + rows.joined(separator: "\n")).write(toFile: a[2], atomically: true, encoding: .utf8)
print("bitmap \(tw)x\(th) -> \(a[2])")
