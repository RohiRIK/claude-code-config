import { spawn } from "bun";
import { mkdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { homedir } from "node:os";

// Resolve paths relative to THIS script, ensuring it works from anywhere
const TOOLS_DIR = import.meta.dir;
const PROJECT_ROOT = resolve(TOOLS_DIR, "../../.."); // Up 3 levels: Tools -> Goose -> skills -> root
const RECIPES_DIR = resolve(TOOLS_DIR, "../Recipes");
const LOG_DIR = join(homedir(), ".gemini", "goose-logs");

// Ensure log dir exists
await mkdir(LOG_DIR, { recursive: true });

// Simple Argument Parsing
const args = process.argv.slice(2);
const recipeName = args[0];
const passThroughArgs = args.slice(1);

if (!recipeName || recipeName.startsWith("-")) {
  console.error(`
Usage: bun run-recipe.ts <recipe_name> [flags]

Examples:
  bun run-recipe.ts comedian --params input_file="src/index.ts"
  bun run-recipe.ts commit_reviewer
  `);
  process.exit(1);
}

// Auto-append .yaml if missing
const recipeFile = recipeName.endsWith(".yaml") ? recipeName : `${recipeName}.yaml`;
const recipePath = join(RECIPES_DIR, recipeFile);

// Sanitize timestamp for filename (replace : with -)
const timestamp = new Date().toISOString().replace(/:/g, "-");
const logFile = join(LOG_DIR, `${timestamp}-${recipeName.replace(".yaml", "")}.log`);

console.log(`[GooseWrapper] Target Recipe: ${recipePath}`);
console.log(`[GooseWrapper] Logging to: ${logFile}`);

try {
  // Use Bun's native file writer
  const logWriter = Bun.file(logFile).writer();

  // Spawn Goose
  // We inherit the environment to ensure we find 'goose', 'git', etc.
  const proc = spawn(["goose", "run", "--recipe", recipePath, ...passThroughArgs], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: process.cwd(), // Run in the user's current directory
    env: { ...process.env, "NO_COLOR": "true" }, // Optional: try to strip ANSI for logs? keeping default for now
  });

  // Stream Handler with correct UTF-8 decoding
  const handleStream = async (stream: ReadableStream, isError: boolean) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // { stream: true } handles multi-byte characters split across chunks
      const text = decoder.decode(value, { stream: true });
      
      // 1. Write to Log File
      logWriter.write(text);
      
      // 2. Write to Console
      if (isError) {
        process.stderr.write(text);
      } else {
        process.stdout.write(text);
      }
    }
  };

  await Promise.all([
    handleStream(proc.stdout, false),
    handleStream(proc.stderr, true),
  ]);

  const exitCode = await proc.exited;
  logWriter.flush();
  logWriter.end();

  if (exitCode !== 0) {
    console.error(`\n[GooseWrapper] Process exited with code ${exitCode}`);
    process.exit(exitCode);
  }

} catch (error) {
  console.error("\n[GooseWrapper] Fatal Error:", error);
  process.exit(1);
}