#!/usr/bin/env bun
/**
 * observe-briefing.ts
 * Shared briefing builders for the Lean Observe System.
 *
 * buildQuickBriefing — pure git data (used by SessionStart)
 * buildDeepBriefing  — topic-scoped context gathering (used by PrePlan)
 *
 * No LLM calls — Claude interprets the gathered data in-session.
 */

import { execSync } from "node:child_process";
import { existsSync, openSync, readSync, closeSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CLAUDE_DIR = join(homedir(), ".claude");
const DB_PATH = join(CLAUDE_DIR, "plugins", "data", "ltm-ltm", "ltm.db");

// Cached dynamic import — re-imported only once per process lifetime
let dbModule: { getContextMerge: (project: string) => unknown } | null = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function safeExec(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", timeout: 5000 }).trim();
  } catch (e) {
    process.stderr.write(`[observe-briefing] exec failed: ${cmd} — ${e}\n`);
    return "";
  }
}

type GitChanges = { status: string; diffStat: string };

function getGitChanges(cwd: string): GitChanges {
  const status = safeExec("git status --porcelain", cwd);
  const diffStat = status ? safeExec("git diff --stat HEAD", cwd) : "";
  return { status, diffStat };
}

function getRecentCommits(cwd: string): string {
  return safeExec("git log --oneline -5", cwd);
}

async function getLtmRecallsForTopic(topic: string, project: string): Promise<string[]> {
  if (!existsSync(DB_PATH)) return [];
  try {
    if (!dbModule) {
      dbModule = await import(join(CLAUDE_DIR, "memory/db.js")) as typeof dbModule;
    }
    const merged = dbModule!.getContextMerge(project) as {
      globals: Array<{ id: number; content: string }>;
      scoped: Array<{ id: number; content: string }>;
    };

    const topicWords = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const isRelevant = (content: string): boolean =>
      topicWords.some((w) => content.toLowerCase().includes(w));

    const recalls: string[] = [];
    for (const m of merged.globals.slice(0, 5)) {
      if (isRelevant(m.content)) recalls.push(`[global] ${m.content}`);
    }
    for (const m of merged.scoped.slice(0, 10)) {
      if (isRelevant(m.content)) recalls.push(`[project] ${m.content}`);
    }
    // Fallback to top project items if nothing matched
    if (recalls.length === 0) {
      for (const m of merged.scoped.slice(0, 3)) recalls.push(`[project] ${m.content}`);
    }
    return recalls.slice(0, 20);
  } catch (e) {
    process.stderr.write(`[observe-briefing] LTM recall failed: ${e}\n`);
    return [];
  }
}

function readFileSnippet(filePath: string, lines = 50): string {
  try {
    const fd = openSync(filePath, "r");
    const buffer = Buffer.alloc(64 * 1024);
    const bytesRead = readSync(fd, buffer, 0, buffer.length, 0);
    closeSync(fd);
    return buffer
      .subarray(0, bytesRead)
      .toString("utf-8")
      .split("\n")
      .slice(0, lines)
      .join("\n");
  } catch {
    return "";
  }
}

function extractFilePaths(topic: string, cwd: string): string[] {
  const matches =
    topic.match(/[\w./\-]+\.(ts|tsx|js|jsx|py|rs|go|swift|md|json|yaml|yml)/g) ?? [];
  return matches.map((p) => (p.startsWith("/") ? p : join(cwd, p)));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Quick briefing — pure git state.
 * Returns empty string when there are no uncommitted changes.
 * Used by SessionStart for broad general awareness.
 */
export async function buildQuickBriefing(cwd: string): Promise<string> {
  const { status, diffStat } = getGitChanges(cwd);
  if (!status) return "";

  const count = status.split("\n").filter(Boolean).length;
  const summary = diffStat
    ? diffStat.split("\n").at(-1)?.trim() ?? ""
    : "";

  return summary
    ? `**Uncommitted:** ${count} file(s) — ${summary}`
    : `**Uncommitted:** ${count} file(s) with pending changes`;
}

/**
 * Deep briefing — topic-scoped context for /plan.
 * Gathers git state, LTM recalls, and target file snippets.
 * Claude interprets the output in-session — no external API call.
 */
export async function buildDeepBriefing(
  cwd: string,
  project: string,
  topic: string,
): Promise<string> {
  const { diffStat: gitDiffStat } = getGitChanges(cwd);
  const recentCommits = getRecentCommits(cwd);
  const ltmRecalls = await getLtmRecallsForTopic(topic, project);

  const fileSnippets = extractFilePaths(topic, cwd)
    .slice(0, 3)
    .map((p) => ({ path: p, content: readFileSnippet(p, 50) }))
    .filter((f) => f.content.length > 0);

  const hasData =
    gitDiffStat || recentCommits || ltmRecalls.length > 0 || fileSnippets.length > 0;
  if (!hasData) return "";

  // Build structured context for Claude to interpret
  const sections: string[] = [
    "### Pre-Plan Context",
    "",
    `> Before planning **"${topic}"**, consider the following codebase state.`,
    "> Flag risks, relevant past decisions, and conflicts in your plan.",
    "",
  ];

  if (gitDiffStat) {
    sections.push("**Uncommitted changes:**", "```", gitDiffStat, "```", "");
  }

  if (recentCommits) {
    sections.push("**Recent commits:**", "```", recentCommits, "```", "");
  }

  if (ltmRecalls.length > 0) {
    sections.push("**Relevant LTM memories:**");
    for (const r of ltmRecalls) sections.push(`- ${r}`);
    sections.push("");
  }

  for (const { path, content } of fileSnippets) {
    sections.push(`**Target file** \`${path}\`:`, "```", content, "```", "");
  }

  return sections.join("\n");
}
