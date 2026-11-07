import { readFile, mkdir, copyFile } from "node:fs/promises";
import vm from "node:vm";

// Deployment packaging only: the source index.html also runs without this step.
const html = await readFile("index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length !== 1)
  throw new Error("Expected one self-contained game script.");
new vm.Script(scripts[0][1], { filename: "index.html" });
for (const marker of [
  "<title>",
  'name="description"',
  'property="og:image"',
  'rel="icon"',
]) {
  if (!html.includes(marker)) throw new Error(`Missing metadata: ${marker}`);
}
if (/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(html))
  throw new Error("Runtime assets must be local.");
await mkdir("dist", { recursive: true });
for (const file of ["index.html", "social-card.svg"])
  await copyFile(file, `dist/${file}`);
console.log(
  `Production export: dist/index.html (${Buffer.byteLength(html).toLocaleString()} bytes), dist/social-card.svg`,
);
