/**
 * PostEditCheck — consolidated post-edit hook for JS/TS files.
 * Biome format → tsc type check → console.log warning.
 */

import { readStdinPassthrough, parseHookInput } from "../lib/hookUtils.js";
import { existsSync } from "fs";
import { dirname, resolve } from "path";

const raw = await readStdinPassthrough();
const parsed = parseHookInput(raw);
if (!parsed) process.exit(0);

const filePath: string = parsed.input.tool_input?.file_path ?? "";
if (!filePath || !existsSync(filePath)) process.exit(0);

const isTs = /\.(ts|tsx)$/.test(filePath);
if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) process.exit(0);

try {
  const biome = Bun.spawnSync(["bunx", "biome", "check", "--write", filePath], {
    stderr: "pipe",
    stdout: "pipe",
  });
  const output = biome.stderr.toString().trim();
  if (output) {
    console.error(output.split("\n").slice(0, 10).join("\n"));
  }
} catch {}

if (isTs) {
  try {
    let projectRoot = dirname(filePath);
    while (projectRoot !== "/" && !existsSync(resolve(projectRoot, "package.json"))) {
      projectRoot = dirname(projectRoot);
    }

    if (existsSync(resolve(projectRoot, "tsconfig.json"))) {
      const tsc = Bun.spawnSync(["bunx", "tsc", "--noEmit", "--pretty", "false"], {
        cwd: projectRoot,
        stderr: "pipe",
        stdout: "pipe",
        // Full-project tsc can take minutes on big repos; cap the per-edit cost.
        timeout: 15_000,
      });
      const output = tsc.stdout.toString().trim();
      if (output) {
        // tsc emits paths relative to cwd — match both forms.
        const relPath = filePath.startsWith(projectRoot + "/")
          ? filePath.slice(projectRoot.length + 1)
          : filePath;
        const fileErrors = output
          .split("\n")
          .filter((line: string) => line.includes(relPath) || line.includes(filePath))
          .slice(0, 10);
        if (fileErrors.length > 0) {
          console.error(fileErrors.join("\n"));
        }
      }
    }
  } catch {}
}

try {
  const content = await Bun.file(filePath).text();
  const matches: string[] = [];
  content.split("\n").forEach((line: string, i: number) => {
    if (/console\.log/.test(line)) {
      matches.push(`${i + 1}: ${line.trim()}`);
    }
  });
  if (matches.length > 0) {
    console.error(`[PostEditCheck] WARNING: console.log found in ${filePath}`);
    matches.slice(0, 5).forEach((m: string) => console.error(m));
    console.error("[PostEditCheck] Remove console.log before committing");
  }
} catch {}
