import { readdir, stat, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

// --- Configuration ---
const CONFIG = {
  logDir: resolve(import.meta.dir, "../gooshistory"),
  defaultDays: 7,
};

// --- Main ---
async function main() {
  // 1. Robust Argument Parsing (Native Node/Bun API)
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      days: { type: "string", short: "d", default: CONFIG.defaultDays.toString() },
      "dry-run": { type: "boolean", default: false },
    },
    strict: true,
    allowPositionals: true,
  });

  const days = parseInt(values.days!, 10);
  const dryRun = values["dry-run"]!;

  if (isNaN(days) || days < 0) {
    console.error("Error: --days must be a positive integer.");
    process.exit(1);
  }

  // 2. Logic
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  console.log(`[Goose] Pruning logs older than ${days} days...`);
  if (dryRun) console.log(`[Goose] DRY RUN MODE`);

  try {
    const files = await readdir(CONFIG.logDir);

    // 3. Parallel Processing (Performance Boost)
    const results = await Promise.all(
      files.map(async (file) => {
        if (!file.endsWith(".log")) return { type: "skipped" };
        const filePath = join(CONFIG.logDir, file);
        try {
          const stats = await stat(filePath);
          if (stats.mtimeMs < cutoffTime) {
            if (!dryRun) await unlink(filePath);
            return { type: "deleted", file, time: new Date(stats.mtimeMs).toISOString() };
          }
          return { type: "kept" };
        } catch (error) {
          return { type: "error", file, error };
        }
      })
    );

    // 4. Reporting
    const deleted = results.filter((r) => r && "type" in r && r.type === "deleted") as any[];
    const errors = results.filter((r) => r && "type" in r && r.type === "error") as any[];
    const kept = results.filter((r) => r && "type" in r && r.type === "kept") as any[];

    deleted.forEach(d => console.log(`  Deleted: ${d.file} (${d.time})`));
    errors.forEach(e => console.error(`  Error: ${e.file}`, e.error));

    console.log(`
──────────────────────────────────────────────────
Cleanup Complete
Deleted: ${deleted.length}
Kept:    ${kept.length}
Errors:  ${errors.length}
──────────────────────────────────────────────────
`);
  } catch (error) {
    console.error(`[Goose] Fatal Error accessing ${CONFIG.logDir}:`, error);
    process.exit(1);
  }
}

main();
