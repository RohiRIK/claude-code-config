#!/usr/bin/env bun
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { PROJECTS_DIR } from "../lib/resolveProject.js";
import { trimToLines } from "../lib/hookUtils.js";

// Cleanup Hook
// Runs at session end (Stop hook, last).
// - Trims context-progress.md to last 20 completed items
// - Deletes project context dirs inactive for more than 14 days
// Never touches context-decisions.md or context-gotchas.md (permanent).
const STALE_DAYS = 14;
const MAX_PROGRESS_ITEMS = 20;

function isStaleDir(dirPath: string): boolean {
  try {
    const files = readdirSync(dirPath);
    if (files.length === 0) return true;
    // Use the most recently modified file's mtime
    const latest = files
      .map(f => statSync(join(dirPath, f)).mtimeMs)
      .sort((a, b) => b - a)[0];
    const ageMs = Date.now() - latest;
    return ageMs > STALE_DAYS * 24 * 60 * 60 * 1000;
  } catch (_) {
    return false;
  }
}

function trimProgress(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  const trimmed = trimToLines(content, MAX_PROGRESS_ITEMS);
  if (trimmed === content) return;
  writeFileSync(filePath, trimmed);
  console.error(`[Cleanup] Trimmed context-progress.md to last ${MAX_PROGRESS_ITEMS} items`);
}

async function main() {
  let inputStr = "";
  try {
    for await (const chunk of Bun.stdin.stream()) {
      inputStr += new TextDecoder().decode(chunk);
    }
  } catch (_) {}

  // Prevent infinite loop in Stop hook
  try {
    const input = JSON.parse(inputStr);
    if (input.stop_hook_active === true) return;
  } catch (_) {}

  if (!existsSync(PROJECTS_DIR)) return;

  const projectDirs = readdirSync(PROJECTS_DIR);

  for (const dir of projectDirs) {
    const dirPath = join(PROJECTS_DIR, dir);
    try {
      const stat = statSync(dirPath);
      if (!stat.isDirectory()) continue;
    } catch (_) { continue; }

    // Trim progress file
    trimProgress(join(dirPath, "context-progress.md"));

    // Delete stale project dirs (skip decisions + gotchas check — delete whole dir if stale)
    if (isStaleDir(dirPath)) {
      rmSync(dirPath, { recursive: true, force: true });
      console.error(`[Cleanup] Deleted stale project context: ${dir}`);
    }
  }

  console.error("[Cleanup] Done");
}

main();
