// 北海道行程网页的静态开发服务器：支持 --host / --port（或 PORT 环境变量），供 Kimi Work 预览。
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : undefined;
};
const host = argValue("--host") || process.env.HOST || "127.0.0.1";
const port = Number(argValue("--port") || process.env.PORT || 7100);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, "http://local").pathname);
    let path = normalize(url === "/" ? "/index.html" : url);
    if (path.includes("..")) throw new Error("forbidden");
    const file = join(root, path);
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}).listen(port, host, () => {
  console.log(`hokkaido-trip dev server: http://${host}:${port}/`);
});
