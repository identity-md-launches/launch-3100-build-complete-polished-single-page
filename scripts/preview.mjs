import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  const file = path.endsWith("/social-card.svg")
    ? "social-card.svg"
    : path.endsWith("/") || path.endsWith("/index.html")
      ? "index.html"
      : null;
  if (!file) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  try {
    const data = await readFile(`dist/${file}`);
    res.writeHead(200, {
      "Content-Type": file.endsWith(".svg")
        ? "image/svg+xml"
        : "text/html; charset=utf-8",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Run npm run build first.");
  }
});
server.listen(4173, () =>
  console.log("Preview: http://localhost:4173/preview/ (Ctrl+C to stop)"),
);
