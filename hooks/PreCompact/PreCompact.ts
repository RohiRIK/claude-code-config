#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { resolveProject } from "../lib/resolveProject.js";
import { readStdin, parseHookInput, readFileSafe } from "../lib/hookUtils.js";

const BUDGET_GOALS = 10;
const BUDGET_PROGRESS = 20;
const BUDGET_DECISIONS = 15;
const BUDGET_GOTCHAS = 15;

function budgetSection(raw: string, label: string, budget: number): string {
  if (!raw.trim()) return "";
  const lines = raw.split("\n").filter(Boolean);
  const header = [`## ${label}`, ""];                          // 2 lines overhead
  const available = Math.max(0, budget - header.length - 1);   // -1 for truncation notice
  if (lines.length <= available) {
    return [...header, ...lines, ""].join("\n");
  }
  const kept = lines.slice(-available);
  const omitted = lines.length - available;
  return [...header, ...kept, `… (${omitted} more entries not shown)`, ""].join("\n");
}

function buildSummary(name: string, cwd: string, projectDir: string): string {
  const goals = readFileSafe(join(projectDir, "context-goals.md"));
  const decisions = readFileSafe(join(projectDir, "context-decisions.md"));
  const progress = readFileSafe(join(projectDir, "context-progress.md"));
  const gotchas = readFileSafe(join(projectDir, "context-gotchas.md"));
  const timestamp = new Date().toISOString().replace("T", " ").replace(/\..+/, "");

  const parts = [
    `# Context Summary\n**Project:** ${name} (${cwd})\n**Compaction checkpoint:** ${timestamp}\n`,
    budgetSection(goals,      "Current Goal",       BUDGET_GOALS),
    budgetSection(progress,   "Recent Progress",    BUDGET_PROGRESS),
    budgetSection(decisions,  "Key Decisions",      BUDGET_DECISIONS),
    budgetSection(gotchas,    "Gotchas / Watch Out", BUDGET_GOTCHAS),
  ];

  return parts.join("");
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

    const finalSummary = buildSummary(name, cwd, projectDir);

    writeFileSync(join(projectDir, "context-summary.md"), finalSummary);
    console.error(`[PreCompact] Saved context summary for "${name}" (${finalSummary.split("\n").length} lines)`);
  } catch (err) {
    console.error("[PreCompact] Failed to save context summary:", err);
  }
}

main();
