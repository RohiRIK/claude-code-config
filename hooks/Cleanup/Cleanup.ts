#!/usr/bin/env bun
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { PROJECTS_DIR } from "../lib/resolveProject.js";
import { trimToLines } from "../lib/hookUtils.js";

// Cleanup Hook
// Runs at session end (Stop hook, last).
// - Trims context-progress (DB or .md) to last 20 completed items
// - Deletes project context dirs inactive for more than 14 days
// Never touches context-decisions or context-gotchas (permanent).
const STALE_DAYS = 14;
const MAX_PROGRESS_ITEMS = 20;
const DB_PATH = join(homedir(), ".claude", "memory", "ltm.db");

function isStaleDir(dirPath: string): boolean {
  try {
    const files = readdirSync(dirPath);
    if (files.length === 0) return true;
    const latest = files
      .map((f: string) => statSync(join(dirPath, f)).mtimeMs)
      .sort((a: number, b: number) => b - a)[0];
    if (latest === undefined) return true;
    return Date.now() - latest > STALE_DAYS * 24 * 60 * 60 * 1000;
  } catch (_) {
    return false;
  }
}

function trimProgressFile(filePath: string): void {
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

  try {
    const input = JSON.parse(inputStr) as Record<string, unknown>;
    if (input.stop_hook_active === true) return;
  } catch (_) {}

  if (!existsSync(PROJECTS_DIR)) return;

  // DB-based trim for all registered projects
  if (existsSync(DB_PATH)) {
    try {
      const registryPath = join(homedir(), ".claude/projects/registry.json");
      if (existsSync(registryPath)) {
        const registry = JSON.parse(readFileSync(registryPath, "utf-8")) as Record<string, string>;
        const { trimProgress } = await import(join(homedir(), ".claude/memory/context.js"));
        for (const name of Object.values(registry)) {
          trimProgress(name, MAX_PROGRESS_ITEMS);
        }
        console.error("[Cleanup] Trimmed progress in DB for all registered projects");
      }
    } catch (dbErr) {
      console.error("[Cleanup] DB trim failed:", dbErr);
    }
  }

  const projectDirs = readdirSync(PROJECTS_DIR);

  for (const dir of projectDirs) {
    const dirPath = join(PROJECTS_DIR, dir);
    try {
      if (!statSync(dirPath).isDirectory()) continue;
    } catch (_) { continue; }

    // Trim .md fallback file if DB not in use
    if (!existsSync(DB_PATH)) {
      trimProgressFile(join(dirPath, "context-progress.md"));
    }

    if (isStaleDir(dirPath)) {
      rmSync(dirPath, { recursive: true, force: true });
      console.error(`[Cleanup] Deleted stale project context: ${dir}`);
    }
  }

  console.error("[Cleanup] Done");
}

main();
