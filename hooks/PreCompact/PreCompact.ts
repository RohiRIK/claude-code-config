#!/usr/bin/env bun
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { resolveProject } from "../lib/resolveProject.js";
import { readStdin, parseHookInput, readFileSafe } from "../lib/hookUtils.js";

const BUDGET_GOALS = 10;
const BUDGET_PROGRESS = 20;
const BUDGET_DECISIONS = 15;
const BUDGET_GOTCHAS = 15;

function budgetSection(lines: string[], label: string, budget: number): string {
  if (lines.length === 0) return "";
  const available = Math.max(0, budget - 3); // header(2) + trailing blank
  if (lines.length <= available) {
    return [`## ${label}`, "", ...lines, ""].join("\n");
  }
  const kept = lines.slice(-available);
  const omitted = lines.length - available;
  return [`## ${label}`, "", ...kept, `… (${omitted} more entries not shown)`, ""].join("\n");
}

function buildSummaryFromDb(name: string, cwd: string): string | null {
  try {
    const { getItems, exportContextMarkdown } = require(join(homedir(), ".claude/memory/context.js"));
    exportContextMarkdown(name);
    const goals     = getItems(name, "goal").map((i: any) => i.content);
    const decisions = getItems(name, "decision").map((i: any) => i.content);
    const progress  = getItems(name, "progress", 20).map((i: any) => i.content);
    const gotchas   = getItems(name, "gotcha").map((i: any) => i.content);
    const timestamp = new Date().toISOString().replace("T", " ").replace(/\..+/, "");
    return [
      `# Context Summary\n**Project:** ${name} (${cwd})\n**Compaction checkpoint:** ${timestamp}\n`,
      budgetSection(goals,     "Current Goal",        BUDGET_GOALS),
      budgetSection(progress,  "Recent Progress",     BUDGET_PROGRESS),
      budgetSection(decisions, "Key Decisions",       BUDGET_DECISIONS),
      budgetSection(gotchas,   "Gotchas / Watch Out", BUDGET_GOTCHAS),
    ].join("");
  } catch (_) {
    return null;
  }
}

function buildSummaryFromFiles(name: string, cwd: string, projectDir: string): string {
  const toLines = (raw: string) => raw.split("\n").filter(Boolean);
  const goals     = toLines(readFileSafe(join(projectDir, "context-goals.md")));
  const decisions = toLines(readFileSafe(join(projectDir, "context-decisions.md")));
  const progress  = toLines(readFileSafe(join(projectDir, "context-progress.md")));
  const gotchas   = toLines(readFileSafe(join(projectDir, "context-gotchas.md")));
  const timestamp = new Date().toISOString().replace("T", " ").replace(/\..+/, "");
  return [
    `# Context Summary\n**Project:** ${name} (${cwd})\n**Compaction checkpoint:** ${timestamp}\n`,
    budgetSection(goals,     "Current Goal",        BUDGET_GOALS),
    budgetSection(progress,  "Recent Progress",     BUDGET_PROGRESS),
    budgetSection(decisions, "Key Decisions",       BUDGET_DECISIONS),
    budgetSection(gotchas,   "Gotchas / Watch Out", BUDGET_GOTCHAS),
  ].join("");
}

async function main(): Promise<void> {
  try {
    const raw = await readStdin();
    const parsed = parseHookInput(raw);

    if (!parsed) {
      console.error("[PreCompact] No cwd found in input, skipping");
      return;
    }

    const { cwd } = parsed;
    const { name, projectDir } = resolveProject(cwd);

    if (!existsSync(projectDir)) mkdirSync(projectDir, { recursive: true });

    // Try DB first; fall back to .md files if DB doesn't exist yet
    const dbPath = join(homedir(), ".claude/memory/ltm.db");
    const finalSummary = existsSync(dbPath)
      ? (buildSummaryFromDb(name, cwd) ?? buildSummaryFromFiles(name, cwd, projectDir))
      : buildSummaryFromFiles(name, cwd, projectDir);

    const { writeFileSync } = await import("fs");
    writeFileSync(join(projectDir, "context-summary.md"), finalSummary);
    console.error(`[PreCompact] Saved context summary for "${name}" (${finalSummary.split("\n").length} lines)`);
  } catch (err) {
    console.error("[PreCompact] Failed to save context summary:", err);
  }
}

main();
