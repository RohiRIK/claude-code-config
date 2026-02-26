#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { resolveProject, registerPath, PROJECTS_DIR } from "../lib/resolveProject.js";
import { readStdin, parseHookInput, trimToLines } from "../lib/hookUtils.js";

const CLAUDE_DIR = join(homedir(), ".claude");
const TMP_DIR = join(CLAUDE_DIR, "tmp");
const COUNTER_FILE = join(TMP_DIR, "session-tool-count.txt");
const MAX_INJECT_LINES = 60;
const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function isStale(filePath: string): boolean {
  return Date.now() - statSync(filePath).mtimeMs > MAX_AGE_MS;
}

function defaultName(cwd: string): string {
  const last = cwd.replace(/\/$/, "").split("/").pop() ?? "";
  return last.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

  const summaryPath = join(projectDir, "context-summary.md");

  if (!existsSync(summaryPath)) {
    const contextFiles = ["context-goals.md", "context-decisions.md", "context-progress.md", "context-gotchas.md"];
    const anyExist = contextFiles.some(f => existsSync(join(projectDir, f)));

    if (!anyExist) {
      process.stdout.write(
        `# Project Registered — No Context Files Yet\n\n` +
        `Project **"${name}"** is registered but has no context files.\n` +
        `Should I create them now? (yes/no)\n`
      );
    }
    return;
  }

  if (isStale(summaryPath)) {
    console.error(`[SessionStart] Context for "${name}" is older than ${MAX_AGE_DAYS} days — skipping`);
    return;
  }

  const raw2 = readFileSync(summaryPath, "utf-8");
  const injected = trimToLines(raw2, MAX_INJECT_LINES);

  process.stdout.write(`## Restored Project Context\n\n${injected}\n\n---\n*Context restored from previous session. Update context files as work progresses.*\n`);
  console.error(`[SessionStart] Injected context for "${name}" (${registeredPath ? "registry" : "slug fallback"})`);
}

main();
