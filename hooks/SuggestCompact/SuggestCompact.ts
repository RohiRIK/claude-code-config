#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Strategic Compact Suggester
// Suggests compaction after threshold

const TMP_DIR = join(homedir(), ".claude", "tmp");
const COUNTER_FILE = join(TMP_DIR, "session-tool-count.txt");
const THRESHOLD = parseInt(process.env.COMPACT_THRESHOLD || "50", 10);

async function main() {
  // Pass through input to stdout
  const inputChunks = [];
  for await (const chunk of Bun.stdin.stream()) {
    inputChunks.push(chunk);
    process.stdout.write(chunk);
  }
  
  // We don't really need to parse the input for this simple counter logic,
  // but we MUST output it so we don't break the hook chain.

  try {
    let count = 0;
    if (existsSync(COUNTER_FILE)) {
      const content = readFileSync(COUNTER_FILE, "utf-8");
      count = parseInt(content.trim(), 10) || 0;
    }

    count++;
    writeFileSync(COUNTER_FILE, count.toString());

    if (count === THRESHOLD) {
      console.error(`[StrategicCompact] ${THRESHOLD} tool calls reached - consider /compact if transitioning phases`);
    } else if (count > THRESHOLD && count % 25 === 0) {
      console.error(`[StrategicCompact] ${count} tool calls - good checkpoint for /compact if context is stale`);
    }

  } catch (error) {
    console.error("[StrategicCompact] Error:", error);
  }
}

main();
