#!/usr/bin/env bun
/**
 * migrate.ts — One-time migration from Markdown context files to SQLite LTM.
 *
 * Part A: Per-project context files (goals, decisions, progress, gotchas)
 * Part B: Learned patterns from skills/learned/*.md
 *
 * Safe to re-run — dedup_key prevents duplicates in memories table.
 * Run: bun ~/.claude/memory/migrate.ts
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CLAUDE_DIR   = join(homedir(), ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");
const LEARNED_DIR  = join(CLAUDE_DIR, "skills/learned");

// Import local modules
const { addItem } = await import("./context.js");
const { learn }   = await import("./db.js");

// ============================================================
// Part A: Per-project context files
// ============================================================

type ContextType = "goal" | "decision" | "progress" | "gotcha";

interface FileSpec {
  file: string;
  type: ContextType;
}

const FILES: FileSpec[] = [
  { file: "context-goals.md",     type: "goal" },
  { file: "context-decisions.md", type: "decision" },
  { file: "context-progress.md",  type: "progress" },
  { file: "context-gotchas.md",   type: "gotcha" },
];

function readFileSafe(p: string): string {
  try { return existsSync(p) ? readFileSync(p, "utf-8") : ""; } catch { return ""; }
}

function parseLines(raw: string): string[] {
  return raw.split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("#"));
}

// Read registry if available
const registryPath = join(PROJECTS_DIR, "registry.json");
const registry: Record<string, string> = existsSync(registryPath)
  ? JSON.parse(readFileSync(registryPath, "utf-8"))
  : {};

// Build reverse map: project dir name → registered name
const reversedRegistry = Object.fromEntries(
  Object.entries(registry).map(([path, name]) => {
    const dirName = path.replace(/\//g, "-").replace(/\./g, "-");
    return [dirName, name];
  })
);

let ctxGoals = 0, ctxDecisions = 0, ctxProgress = 0, ctxGotchas = 0;
let projectCount = 0;

if (existsSync(PROJECTS_DIR)) {
  const dirs = readdirSync(PROJECTS_DIR).filter(d => {
    try {
      const s = Bun.file(join(PROJECTS_DIR, d)).size;
      return d !== "registry.json";
    } catch { return false; }
  });

  for (const dirName of dirs) {
    const dirPath = join(PROJECTS_DIR, dirName);
    // Skip non-directories and the registry file
    try {
      const stat = Bun.file(dirPath);
    } catch { continue; }

    // Resolve project name from registry or use dir name
    const projectName = reversedRegistry[dirName] ?? dirName;

    let hadAny = false;

    for (const { file, type } of FILES) {
      const filePath = join(dirPath, file);
      const raw = readFileSafe(filePath);
      if (!raw.trim()) continue;

      const lines = parseLines(raw);
      for (const line of lines) {
        if (line.startsWith("…") || line.startsWith("✓") && type !== "progress") {
          // Strip checkmark from non-progress lines or skip truncation notices
          if (line.startsWith("…")) continue;
        }
        try {
          addItem(projectName, type, line, undefined);
          hadAny = true;
          if (type === "goal")     ctxGoals++;
          if (type === "decision") ctxDecisions++;
          if (type === "progress") ctxProgress++;
          if (type === "gotcha")   ctxGotchas++;
        } catch (_) {}
      }
    }

    if (hadAny) projectCount++;
  }
}

console.log(`\n[migrate] Part A: Context files`);
console.log(`  Projects processed: ${projectCount}`);
console.log(`  Goals: ${ctxGoals}, Decisions: ${ctxDecisions}, Progress: ${ctxProgress}, Gotchas: ${ctxGotchas}`);

// ============================================================
// Part B: Learned patterns from skills/learned/*.md
// ============================================================

type MemoryCategory = "preference" | "architecture" | "gotcha" | "pattern" | "workflow" | "constraint";

function inferCategory(content: string, filename: string): MemoryCategory {
  const lower = (content + filename).toLowerCase();
  if (lower.includes("gotcha") || lower.includes("warning") || lower.includes("watch out") || lower.includes("never")) return "gotcha";
  if (lower.includes("prefer") || lower.includes("always use") || lower.includes("instead of")) return "preference";
  if (lower.includes("architect") || lower.includes("design") || lower.includes("schema") || lower.includes("database")) return "architecture";
  if (lower.includes("workflow") || lower.includes("process") || lower.includes("step")) return "workflow";
  if (lower.includes("constraint") || lower.includes("limit") || lower.includes("max")) return "constraint";
  return "pattern";
}

function parseLearnedFile(filePath: string): { content: string; category: MemoryCategory }[] {
  const raw = readFileSafe(filePath);
  if (!raw.trim()) return [];

  const filename = filePath.split("/").pop() ?? "";
  const results: { content: string; category: MemoryCategory }[] = [];

  // Extract sections: Problem, Solution, When to Use
  const sectionRegex = /^##\s+(.+)$/gm;
  const sections: { title: string; start: number }[] = [];
  let match;
  while ((match = sectionRegex.exec(raw)) !== null) {
    sections.push({ title: match[1].trim(), start: match.index + match[0].length });
  }

  for (let i = 0; i < sections.length; i++) {
    const { title, start } = sections[i];
    const end = i + 1 < sections.length ? sections[i + 1].start : raw.length;
    const body = raw.slice(start, end).trim();

    if (!body || body.length < 10) continue;
    if (title.toLowerCase().includes("example")) continue; // skip code examples

    // First line of body as content
    const firstLine = body.split("\n")[0].trim().replace(/^[-*]\s+/, "");
    if (firstLine.length < 10) continue;

    results.push({
      content: `[${title}] ${firstLine}`,
      category: inferCategory(firstLine, filename),
    });
  }

  // If no sections parsed, use the first meaningful line
  if (results.length === 0) {
    const lines = parseLines(raw);
    const first = lines.find(l => l.length > 15 && !l.startsWith("#"));
    if (first) {
      results.push({ content: first, category: inferCategory(first, filename) });
    }
  }

  return results;
}

let learnCreated = 0, learnReinforced = 0;

if (existsSync(LEARNED_DIR)) {
  const files = readdirSync(LEARNED_DIR).filter(f => f.endsWith(".md"));

  for (const file of files) {
    const filePath = join(LEARNED_DIR, file);
    const insights = parseLearnedFile(filePath);

    for (const { content, category } of insights) {
      try {
        const result = learn({
          content,
          category,
          importance: 3,
          source: `migration:${file}`,
        });
        if (result.action === "created") learnCreated++;
        else learnReinforced++;
      } catch (_) {}
    }
  }
}

console.log(`\n[migrate] Part B: Learned patterns`);
console.log(`  Created: ${learnCreated}, Reinforced/skipped: ${learnReinforced}`);
console.log(`\n[migrate] Done. Run 'bun -e "import(\\'./memory/db.js\\').then(m => m.exportMarkdown())"' to regenerate docs/memory-long-term.md`);
