#!/usr/bin/env bun
/**
 * Observe.ts
 * Deterministic codebase observer — no LLM, pure data gathering.
 * Levels: --quick (git status + LTM + context), --deep (+ commits + file tree + deps),
 *         --focused <path> (+ commits + scoped file tree)
 *
 * Usage (standalone):
 *   bun ~/.claude/hooks/Observe/Observe.ts --deep --cwd /path/to/project
 *   bun ~/.claude/hooks/Observe/Observe.ts --quick --cwd /path/to/project
 *   bun ~/.claude/hooks/Observe/Observe.ts --focused src/auth --cwd /path/to/project
 *
 * Usage (hook mode): pipe JSON with { cwd } via stdin, add --quick/--deep flag.
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import { resolveProject } from "../lib/resolveProject.js";
import { logHook } from "../lib/hookLogger.js";
import { readStdin, parseHookInput } from "../lib/hookUtils.js";

const CLAUDE_DIR = join(homedir(), ".claude");
const TMP_DIR = join(CLAUDE_DIR, "tmp");
const DB_PATH = join(CLAUDE_DIR, "memory", "ltm.db");
const OBSERVATION_FLAG = join(TMP_DIR, "observation-done.txt");
const OBSERVATION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// ---------------------------------------------------------------------------
// Session flag helpers
// ---------------------------------------------------------------------------

export function isObservationDone(): boolean {
  if (!existsSync(OBSERVATION_FLAG)) return false;
  try {
    const ts = Number(readFileSync(OBSERVATION_FLAG, "utf-8").trim());
    return Date.now() - ts < OBSERVATION_TTL_MS;
  } catch {
    return false;
  }
}

export function markObservationDone(): void {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  writeFileSync(OBSERVATION_FLAG, String(Date.now()));
}

// ---------------------------------------------------------------------------
// Data gatherers (all deterministic — no LLM)
// ---------------------------------------------------------------------------

function safeExec(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", timeout: 5000 }).trim();
  } catch {
    return "";
  }
}

function getGitStatus(cwd: string): { branch: string; uncommittedCount: number; summary: string } {
  const branch = safeExec("git rev-parse --abbrev-ref HEAD", cwd) || "unknown";
  const statusOut = safeExec("git status --porcelain", cwd);
  const lines = statusOut ? statusOut.split("\n").filter(Boolean) : [];
  return {
    branch,
    uncommittedCount: lines.length,
    summary: lines.slice(0, 10).join("\n"),
  };
}

function getRecentCommits(cwd: string, count = 10): string {
  return safeExec(`git log --oneline -${count}`, cwd);
}

function getFileTree(cwd: string, focusPath?: string): string {
  const root = focusPath ? join(cwd, focusPath) : cwd;
  if (!existsSync(root)) return "";
  const raw = safeExec(
    `find . -maxdepth 3 \\( -name node_modules -o -name .git -o -name dist -o -name .next \\) -prune -o -print`,
    root,
  );
  const entries = raw
    .split("\n")
    .filter(Boolean)
    .filter((l) => l !== ".")
    .slice(0, 50);
  return entries.join("\n");
}

function getDependencies(cwd: string): { deps: number; devDeps: number; name: string } {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) return { deps: 0, devDeps: 0, name: "" };
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return {
      name: pkg.name ?? "",
      deps: Object.keys(pkg.dependencies ?? {}).length,
      devDeps: Object.keys(pkg.devDependencies ?? {}).length,
    };
  } catch {
    return { deps: 0, devDeps: 0, name: "" };
  }
}

async function getLtmRecalls(project: string): Promise<string[]> {
  if (!existsSync(DB_PATH)) return [];
  try {
    const { getContextMerge } = await import(join(CLAUDE_DIR, "memory/db.js"));
    const merged = getContextMerge(project) as {
      globals: Array<{ id: number; content: string }>;
      scoped: Array<{ id: number; content: string }>;
    };
    const items: string[] = [];
    for (const m of merged.globals.slice(0, 5)) items.push(`[global] ${m.content}`);
    for (const m of merged.scoped.slice(0, 10)) items.push(`[project] ${m.content}`);
    return items;
  } catch {
    return [];
  }
}

async function getContextItems(project: string): Promise<string[]> {
  if (!existsSync(DB_PATH)) return [];
  try {
    const { getItems } = await import(join(CLAUDE_DIR, "memory/context.js"));
    const types = ["goal", "decision", "gotcha", "progress"] as const;
    const lines: string[] = [];
    for (const type of types) {
      const items = (getItems(project, type) as Array<{ content: string }>) ?? [];
      for (const item of items.slice(0, 3)) {
        lines.push(`[${type}] ${item.content}`);
      }
    }
    return lines;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Report builder
// ---------------------------------------------------------------------------

export interface ObserveOptions {
  cwd: string;
  level: "quick" | "deep" | "focused";
  focusPath?: string;
}

export async function buildReport(opts: ObserveOptions): Promise<string> {
  const { cwd, level, focusPath } = opts;
  const { name: project } = resolveProject(cwd);

  const lines: string[] = [];

  lines.push(`## 🔭 Observation Report [${level}]`);
  lines.push("");
  lines.push(`**Project**: ${project}  `);
  lines.push(`**CWD**: \`${cwd}\`  `);
  lines.push(`**Time**: ${new Date().toISOString()}`);
  lines.push("");

  // --- Git status (all levels) ---
  const git = getGitStatus(cwd);
  lines.push("### Git Status");
  lines.push(`- Branch: \`${git.branch}\``);
  lines.push(`- Uncommitted files: ${git.uncommittedCount}`);
  if (git.summary) {
    lines.push("```");
    lines.push(git.summary);
    lines.push("```");
  }
  lines.push("");

  // --- Recent commits (deep & focused) ---
  if (level === "deep" || level === "focused") {
    const commits = getRecentCommits(cwd, 10);
    if (commits) {
      lines.push("### Recent Commits");
      lines.push("```");
      lines.push(commits);
      lines.push("```");
      lines.push("");
    }
  }

  // --- File tree (deep & focused) ---
  if (level === "deep" || level === "focused") {
    const tree = getFileTree(cwd, focusPath);
    if (tree) {
      const header = focusPath ? `### File Tree (\`${focusPath}\`)` : "### File Tree";
      lines.push(header);
      lines.push("```");
      lines.push(tree);
      lines.push("```");
      lines.push("");
    }
  }

  // --- Dependencies (deep only) ---
  if (level === "deep") {
    const deps = getDependencies(cwd);
    if (deps.deps > 0 || deps.devDeps > 0) {
      lines.push("### Dependencies");
      if (deps.name) lines.push(`- Package: \`${deps.name}\``);
      lines.push(`- Production: ${deps.deps}`);
      lines.push(`- Dev: ${deps.devDeps}`);
      lines.push("");
    }
  }

  // --- LTM recalls (all levels) ---
  const ltmItems = await getLtmRecalls(project);
  if (ltmItems.length > 0) {
    lines.push("### LTM Recalls");
    for (const item of ltmItems) lines.push(`- ${item}`);
    lines.push("");
  }

  // --- Context items (all levels) ---
  const ctxItems = await getContextItems(project);
  if (ctxItems.length > 0) {
    lines.push("### Project Context");
    for (const item of ctxItems) lines.push(`- ${item}`);
    lines.push("");
  }

  // --- Risk flags ---
  const risks: string[] = [];
  if (git.uncommittedCount > 0) risks.push(`⚠️  ${git.uncommittedCount} uncommitted file(s)`);
  if (ctxItems.some((l) => l.startsWith("[gotcha]"))) risks.push("⚠️  LTM gotchas exist for this project");
  if (risks.length > 0) {
    lines.push("### Risk Flags");
    for (const r of risks) lines.push(`- ${r}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function persistObservation(project: string, report: string): Promise<void> {
  if (!existsSync(DB_PATH)) return;
  try {
    const { learn } = await import(join(CLAUDE_DIR, "memory/db.js"));
    const compact = report
      .split("\n")
      .filter((l) => l.startsWith("- ") || l.startsWith("**") || l.startsWith("### "))
      .slice(0, 20)
      .join(" | ");
    learn({
      project,
      content: compact,
      category: "observation",
      importance: 2,
      tags: ["auto-observation"],
    });
  } catch {
    // persistence failure is non-fatal
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let level: "quick" | "deep" | "focused" = "deep";
  let focusPath: string | undefined;
  let cwd = process.cwd();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--quick") level = "quick";
    else if (args[i] === "--deep") level = "deep";
    else if (args[i] === "--focused") { level = "focused"; focusPath = args[++i]; }
    else if (args[i] === "--cwd") cwd = args[++i] ?? cwd;
  }

  // Hook mode: read cwd from stdin JSON if not given via --cwd
  if (!args.includes("--cwd")) {
    try {
      const raw = await readStdin();
      const parsed = parseHookInput(raw);
      if (parsed?.cwd) cwd = parsed.cwd;
    } catch {
      // not in hook mode
    }
  }

  try {
    const report = await buildReport({ cwd, level, focusPath });
    const { name: project } = resolveProject(cwd);
    await persistObservation(project, report);
    markObservationDone();
    process.stdout.write(report + "\n");
    logHook("Observe", "info", `Observation complete [${level}] for ${project}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[Observe] Error: ${msg}\n`);
    logHook("Observe", "error", `Observation failed: ${msg}`);
    process.exit(1);
  }
}

main();
