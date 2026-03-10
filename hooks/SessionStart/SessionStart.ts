#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { resolveProject, registerPath, PROJECTS_DIR } from "../lib/resolveProject.js";
import { readStdin, parseHookInput, trimToLines } from "../lib/hookUtils.js";

const CLAUDE_DIR   = join(homedir(), ".claude");
const TMP_DIR      = join(CLAUDE_DIR, "tmp");
const COUNTER_FILE = join(TMP_DIR, "session-tool-count.txt");
const DB_PATH      = join(CLAUDE_DIR, "memory", "ltm.db");
const MAX_INJECT_LINES = 60;
const MAX_LTM_LINES    = 30;
const MAX_AGE_MS       = 30 * 24 * 60 * 60 * 1000;

function defaultName(cwd: string): string {
  const last = cwd.replace(/\/$/, "").split("/").pop() ?? "";
  return last.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function buildLtmSection(project: string): Promise<string> {
  if (!existsSync(DB_PATH)) return "";
  try {
    const { getContextMerge } = await import(join(CLAUDE_DIR, "memory/db.js"));
    const { globals, scoped } = getContextMerge(project) as {
      globals: Array<{ id: number; content: string }>;
      scoped:  Array<{ id: number; content: string; importance: number }>;
    };

    if (globals.length === 0 && scoped.length === 0) return "";

    const lines: string[] = ["LTM:", ""];

    if (globals.length > 0) {
      lines.push("globals:");
      for (const m of globals) lines.push(`- [${m.id}] ${m.content}`);
      lines.push("");
    }

    if (scoped.length > 0) {
      lines.push("project:");
      for (const m of scoped) lines.push(`- [${m.id}] ${m.content}`);
      lines.push("");
    }

    const allLines = lines.join("\n").split("\n");
    if (allLines.length > MAX_LTM_LINES) {
      return allLines.slice(0, MAX_LTM_LINES).join("\n") + "\n… (truncated)\n";
    }
    return lines.join("\n");
  } catch (_) {
    return "";
  }
}

async function main(): Promise<void> {
  const raw = await readStdin();
  const parsed = parseHookInput(raw);

  // Reset tool counter
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  writeFileSync(COUNTER_FILE, "0");

  if (!parsed) {
    console.error("[SessionStart] No cwd in input, skipping context injection");
    return;
  }

  const { cwd } = parsed;
  const { name, projectDir, isNew, registeredPath } = resolveProject(cwd);

  if (isNew) {
    const suggested = defaultName(cwd);
    registerPath(cwd, suggested);
    mkdirSync(join(PROJECTS_DIR, suggested), { recursive: true });

    process.stdout.write(
      `# New Project Detected\n\n` +
      `No context files found for: \`${cwd}\`\n\n` +
      `I've registered this project as **"${suggested}"** in the context registry.\n` +
      `Context will be saved to \`~/.claude/projects/${suggested}/\`\n\n` +
      `If you'd like a different name, run: \`/register-project\`\n\n` +
      `Should I create the 4 context files now so your work is saved across sessions? (yes/no)\n`
    );
    return;
  }

  // Regenerate context-summary.md from DB before reading it
  if (existsSync(DB_PATH)) {
    try {
      const { exportContextMarkdown } = await import(join(CLAUDE_DIR, "memory/context.js"));
      exportContextMarkdown(name);
    } catch (_) {}
  }

  const summaryPath = join(projectDir, "context-summary.md");

  if (!existsSync(summaryPath)) {
    const contextFiles = ["context-goals.md", "context-decisions.md", "context-progress.md", "context-gotchas.md"];
    if (!contextFiles.some(f => existsSync(join(projectDir, f)))) {
      process.stdout.write(
        `# Project Registered — No Context Files Yet\n\n` +
        `Project **"${name}"** is registered but has no context files.\n` +
        `Should I create them now? (yes/no)\n`
      );
    }
    return;
  }

  if (Date.now() - statSync(summaryPath).mtimeMs > MAX_AGE_MS) {
    console.error(`[SessionStart] Context for "${name}" is older than 30 days — skipping`);
    return;
  }

  const injected = trimToLines(readFileSync(summaryPath, "utf-8"), MAX_INJECT_LINES);
  const ltmSection = await buildLtmSection(name);

  const output = ltmSection ? `${injected}\n\n${ltmSection}\n` : `${injected}\n`;

  process.stdout.write(output);
  console.error(`[SessionStart] Injected context for "${name}" (${registeredPath ? "registry" : "slug fallback"})`);
}

main();
