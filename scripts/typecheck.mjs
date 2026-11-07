import { readFile, mkdir, writeFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";

// No application dependencies. Supply a TypeScript compiler or put tsc on PATH.
// The worker uses a compiler downloaded solely into the disposable scratch area.
const html = await readFile("index.html", "utf8");
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .join("\n");
await mkdir("test/scratch/typecheck", { recursive: true });
await writeFile("test/scratch/typecheck/game.js", script);
await writeFile(
  "test/scratch/typecheck/globals.d.ts",
  `interface Window { ethereum?: any; webkitAudioContext?: typeof AudioContext; }\n`,
);
const scratchCompiler = "test/scratch/tools/typescript/lib/tsc.js";
const localCompiler = await access(scratchCompiler).then(
  () => scratchCompiler,
  () => null,
);
const compiler = process.argv[2] ?? localCompiler;
const args = [
  "--allowJs",
  "--checkJs",
  "--noEmit",
  "--target",
  "ES2020",
  "--lib",
  "ES2020,DOM",
  "--skipLibCheck",
  "test/scratch/typecheck/globals.d.ts",
  "test/scratch/typecheck/game.js",
];
const result = compiler
  ? spawnSync(process.execPath, [compiler, ...args], { stdio: "inherit" })
  : spawnSync("tsc", args, { stdio: "inherit" });
if (result.error) {
  console.error(
    "TypeScript is required for validation only. Run python3 scripts/setup-checks.py, then npm run typecheck; or pass /path/to/typescript/lib/tsc.js.",
  );
  process.exit(1);
}
process.exit(result.status ?? 1);
