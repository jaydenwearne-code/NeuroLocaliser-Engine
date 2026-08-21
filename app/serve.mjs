// serve.mjs — a zero-dependency static server so the app can import the src/ ES modules over http
// (ES-module imports don't work from file://). Serves the repo root.
//   PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH" node app/serve.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, normalize, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = normalize(join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const PORT = process.env.PORT || 8137;
// charset=utf-8 on every text type. Without it the browser guesses, and a file with no <meta charset> of
// its own renders em-dashes as mojibake — which is how docs/artifacts/*.html looked locally, since those
// are fragments whose <head> is supplied by the artifact platform. The files were always valid UTF-8; only
// the local preview lied. Stated here because the tempting "fix" is to mangle the content instead.
const MIME = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8", ".svg":"image/svg+xml; charset=utf-8" };

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(req.url.split("?")[0]);
    if (path === "/" || path === "/app" || path === "/app/") path = "/app/index.html";
    const full = normalize(join(ROOT, path));
    if (!full.startsWith(ROOT)) { res.writeHead(403).end("forbidden"); return; }
    const body = await readFile(full);
    res.writeHead(200, { "content-type": MIME[extname(full)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("not found");
  }
});
server.listen(PORT, () => console.log(`Wearne's NeuroLocaliser → http://localhost:${PORT}/app/`));
