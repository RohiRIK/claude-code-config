#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, sep } from "path";
import { homedir } from "os";

// PreCompact Hook
// Fires before context compaction.
// Reads the 4 Claude-maintained context files and assembles context-summary.md
// context-summary.md is what SessionStart injects on next session start.

const CLAUDE_DIR = join(homedir(), ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");
const MAX_SUMMARY_LINES = 60;

function deriveSlug(cwd: string): string {
  return cwd.replace(new RegExp("\\" + sep, "g"), "-");
}

function readFileSafe(path: string): string {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8").trim();
}

function trimToLines(content: string, max: number): string {
  const lines = content.split("\n");
  if (lines.length <= max) return content;
  return lines.slice(lines.length - max).join("\n");
}

async function main() {
  let inputStr = "";
  try {
    for await (const chunk of Bun.stdin.stream()) {
      inputStr += new TextDecoder().decode(chunk);
    }
  } catch (_) {}

  let input: any = {};
  try { input = JSON.parse(inputStr); } catch (_) {}

  // cwd may be at different keys depending on Claude Code version
  const cwd: string = input.cwd || input.working_directory || input.session?.cwd || "";

  if (!cwd) {
    console.error("[PreCompact] No cwd found in input, skipping");
    return;
  }

  const slug = deriveSlug(cwd);
  const projectDir = join(PROJECTS_DIR, slug);

  if (!existsSync(projectDir)) {
    mkdirSync(projectDir, { recursive: true });
  }

  const goals     = readFileSafe(join(projectDir, "context-goals.md"));
  const decisions = readFileSafe(join(projectDir, "context-decisions.md"));
  const progress  = readFileSafe(join(projectDir, "context-progress.md"));
  const gotchas   = readFileSafe(join(projectDir, "context-gotchas.md"));

  const timestamp = new Date().toISOString().replace("T", " ").replace(/\..+/, "");

  let summary = `# Context Summary\n`;
  summary += `**Project:** ${cwd}\n`;
  summary += `**Compaction checkpoint:** ${timestamp}\n\n`;

  if (goals) {
    summary += `## Current Goal\n${goals}\n\n`;
  }

  if (progress) {
    // Only keep last 10 lines of progress to save space
    const progressLines = progress.split("\n").filter(Boolean);
    const recent = progressLines.slice(-10).join("\n");
    summary += `## Recent Progress\n${recent}\n\n`;
  }

  if (decisions) {
    // Keep last 8 lines
    const decisionLines = decisions.split("\n").filter(Boolean);
    const recent = decisionLines.slice(-8).join("\n");
    summary += `## Key Decisions\n${recent}\n\n`;
  }

  if (gotchas) {
    summary += `## Gotchas / Watch Out\n${gotchas}\n\n`;
  }

  // Hard cap
  const finalSummary = trimToLines(summary, MAX_SUMMARY_LINES);

  writeFileSync(join(projectDir, "context-summary.md"), finalSummary);
  console.error(`[PreCompact] Saved context summary for ${slug}`);
  console.error(`[PreCompact] Summary lines: ${finalSummary.split("\n").length}`);
}

main();
