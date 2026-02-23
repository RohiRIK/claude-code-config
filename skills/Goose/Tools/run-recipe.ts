/**
 * @deprecated Use SpawnAgent.ts instead for non-blocking parallel execution.
 * This file is kept for backwards compatibility only.
 *
 * Migration:
 *   OLD: bun run-recipe.ts code-reviewer --params input_file="src/"
 *   NEW: bun SpawnAgent.ts code-reviewer --params user_input="src/"
 *
 * For blocking behavior: bun SpawnAgent.ts code-reviewer --wait --params ...
 */

import { spawn, file, type FileSink } from "bun";
import { mkdir } from "node:fs/promises";
import { join, resolve, parse } from "node:path";

// --- Configuration ---
const TOOLS_DIR = import.meta.dir;
const RECIPES_DIR = resolve(TOOLS_DIR, "../Recipes");
const LOG_DIR = resolve(TOOLS_DIR, "../gooshistory");

interface RunOptions {
  recipeName: string;
  args: string[];
}

interface AgentIdentity {
  provider: string;
  model: string;
}

// --- Helpers ---

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);
  const recipeName = args[0];

  if (!recipeName || recipeName.startsWith("-")) {
    console.error(`
Usage: bun run-recipe.ts <recipe_name> [flags]

Examples:
  bun run-recipe.ts comedian --params input_file="src/index.ts"
`);
    process.exit(1);
  }

  return { recipeName, args: args.slice(1) };
}

async function pipeOutput(
  readable: ReadableStream<Uint8Array> | null,
  writer: FileSink,
  isErr: boolean
) {
  if (!readable) return;
  const decoder = new TextDecoder();
  for await (const chunk of readable) {
    const text = decoder.decode(chunk);
    writer.write(text);
    (isErr ? process.stderr : process.stdout).write(text);
  }
}

async function extractAgentSignature(logPath: string): Promise<AgentIdentity> {
  try {
    const content = await Bun.file(logPath).text();
    // Look for: "starting session | provider: gemini-cli model: gemini-3-pro-preview"
    const providerMatch = content.match(/provider:\s*([^\s]+)/);
    const modelMatch = content.match(/model:\s*([^\s]+)/);

    return {
      provider: providerMatch ? providerMatch[1] : "Unknown",
      model: modelMatch ? modelMatch[1] : "Default",
    };
  } catch {
    return { provider: "Unknown", model: "Unknown" };
  }
}

// --- Main ---

async function main() {
  // Deprecation warning
  console.warn(`
\x1b[33m╔════════════════════════════════════════════════════════════════════╗
║  DEPRECATED: run-recipe.ts is deprecated.                          ║
║  Use SpawnAgent.ts for non-blocking parallel execution.             ║
║                                                                      ║
║  Migration:                                                          ║
║    bun SpawnAgent.ts <recipe> --params user_input="..."             ║
║    bun SpawnAgent.ts <recipe> --wait --params ...  (blocking)       ║
╚════════════════════════════════════════════════════════════════════╝\x1b[0m
`);

  const { recipeName, args } = parseArgs();

  // Setup Paths
  const parsed = parse(recipeName);
  const safeName = parsed.ext === ".yaml" ? recipeName : `${recipeName}.yaml`;
  const recipePath = join(RECIPES_DIR, safeName);

  // Setup Logging
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logName = `${timestamp}-${parsed.name}.log`;
  const logPath = join(LOG_DIR, logName);

  console.log(`[Goose] Recipe: ${safeName}`);
  console.log(`[Goose] Log:    ${logName}`);

  try {
    await mkdir(LOG_DIR, { recursive: true });

    const logFile = file(logPath);
    const writer = logFile.writer();

    const proc = spawn(["goose", "run", "--recipe", recipePath, ...args], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: process.cwd(),
      env: { ...process.env, NO_COLOR: "true" },
    });

    await Promise.all([
      pipeOutput(proc.stdout, writer, false),
      pipeOutput(proc.stderr, writer, true),
      proc.exited,
    ]);

    await writer.flush();
    writer.end();

    const exitCode = proc.exitCode;

    // --- Footer & Signature ---
    if (exitCode === 0) {
      const identity = await extractAgentSignature(logPath);
      console.log(`
──────────────────────────────────────────────────
Mission Complete
Agent:    Goose
Provider: ${identity.provider}
Model:    ${identity.model}
──────────────────────────────────────────────────
`);
    } else {
      console.error(`
[Goose] Process failed with code ${exitCode}`);
      process.exit(exitCode ?? 1);
    }

  } catch (error) {
    console.error("\n[Goose] Fatal Error:", error);
    process.exit(1);
  }
}

main();
