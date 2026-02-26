#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { resolveProject } from "../lib/resolveProject.js";
import { readStdin, parseHookInput, readFileSafe, trimToLines } from "../lib/hookUtils.js";

const MAX_SUMMARY_LINES = 60;

function buildSummary(name: string, cwd: string, projectDir: string): string {
  const goals = readFileSafe(join(projectDir, "context-goals.md"));
  const decisions = readFileSafe(join(projectDir, "context-decisions.md"));
  const progress = readFileSafe(join(projectDir, "context-progress.md"));
  const gotchas = readFileSafe(join(projectDir, "context-gotchas.md"));
  const timestamp = new Date().toISOString().replace("T", " ").replace(/\..+/, "");

  let summary = `# Context Summary\n`;
  summary += `**Project:** ${name} (${cwd})\n`;
  summary += `**Compaction checkpoint:** ${timestamp}\n\n`;

  if (goals) summary += `## Current Goal\n${goals}\n\n`;
  if (progress) {
    const recent = progress.split("\n").filter(Boolean).slice(-10).join("\n");
    summary += `## Recent Progress\n${recent}\n\n`;
  }
  if (decisions) {
    const recent = decisions.split("\n").filter(Boolean).slice(-8).join("\n");
    summary += `## Key Decisions\n${recent}\n\n`;
  }
  if (gotchas) summary += `## Gotchas / Watch Out\n${gotchas}\n\n`;

  return trimToLines(summary, MAX_SUMMARY_LINES);
}

async function main(): Promise<void> {
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
}

main();
