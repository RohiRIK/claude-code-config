#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, sep } from "path";
import { homedir } from "os";

// SessionStart Hook
// Injects project context-summary.md into Claude's context via stdout.
// Claude sees this as restored context at session start.

const CLAUDE_DIR = join(homedir(), ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");
const TMP_DIR = join(CLAUDE_DIR, "tmp");
const COUNTER_FILE = join(TMP_DIR, "session-tool-count.txt");
const MAX_INJECT_LINES = 60;
const MAX_AGE_DAYS = 30;

function deriveSlug(cwd: string): string {
  return cwd.replace(new RegExp("\\" + sep, "g"), "-");
}

function isStale(filePath: string): boolean {
  const { mtimeMs } = statSync(filePath);
  const ageMs = Date.now() - mtimeMs;
  return ageMs > MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
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

  // Reset tool counter
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  writeFileSync(COUNTER_FILE, "0");

  // Get cwd
  const cwd: string = input.cwd || input.working_directory || input.session?.cwd || "";

  if (!cwd) {
    console.error("[SessionStart] No cwd in input, skipping context injection");
    return;
  }

  const slug = deriveSlug(cwd);
  const summaryPath = join(PROJECTS_DIR, slug, "context-summary.md");

  if (!existsSync(summaryPath)) {
    // Check if any of the 4 context files exist either
    const contextFiles = ["context-goals.md", "context-decisions.md", "context-progress.md", "context-gotchas.md"];
    const anyExist = contextFiles.some(f => existsSync(join(PROJECTS_DIR, slug, f)));

    if (!anyExist) {
      // Prompt Claude to immediately ask user about creating context files
      process.stdout.write(
        `# ACTION REQUIRED — Do This Before Anything Else\n\n` +
        `No session context files exist for project: \`${cwd}\`\n\n` +
        `**Your first and only response must be:**\n\n` +
        `> No context files found for this project. Should I create them so your work is saved across sessions? (yes/no)\n\n` +
        `Rules:\n` +
        `- Output that exact message first, nothing else\n` +
        `- Do not greet, do not answer questions, do not explain\n` +
        `- Wait for yes/no before proceeding\n` +
        `- If yes: create the 4 files at \`~/.claude/projects/${slug}/\` (context-goals.md, context-decisions.md, context-progress.md, context-gotchas.md)\n`
      );
    }
    return;
  }

  if (isStale(summaryPath)) {
    console.error(`[SessionStart] Context for ${slug} is older than ${MAX_AGE_DAYS} days — skipping`);
    return;
  }

  const raw = readFileSync(summaryPath, "utf-8");
  const lines = raw.split("\n");

  // Hard cap
  const injected = lines.length > MAX_INJECT_LINES
    ? lines.slice(lines.length - MAX_INJECT_LINES).join("\n")
    : raw;

  // Write plain text to stdout — Claude Code adds this directly to context
  process.stdout.write(`## Restored Project Context\n\n${injected}\n\n---\n*Context restored from previous session. Update context files as work progresses.*\n`);
  console.error(`[SessionStart] Injected ${lines.length} lines of context for ${slug}`);
}

main();
