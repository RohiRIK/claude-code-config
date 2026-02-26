#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { resolveProject, PROJECTS_DIR, CLAUDE_DIR } from "../lib/resolveProject.js";
import { readStdinPassthrough, parseHookInput, readFileSafe, appendLine } from "../lib/hookUtils.js";

const TOOL_NAMES = new Set(["Write", "Edit", "MultiEdit"]);
const MAX_PROGRESS_LINES = 20;
const MAX_DISPLAY_FILES = 5;

function findTranscriptPath(
  transcriptPath: string | undefined,
  sessionId: string | undefined
): string | null {
  if (transcriptPath && existsSync(transcriptPath)) return transcriptPath;

  const historyFile = join(CLAUDE_DIR, "history.jsonl");
  if (!existsSync(historyFile)) return null;

  const lines = readFileSync(historyFile, "utf-8").trim().split("\n");
  let entry: Record<string, any> | null = null;

  if (sessionId) {
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (parsed.sessionId === sessionId) { entry = parsed; break; }
      } catch {}
    }
  } else {
    try { entry = JSON.parse(lines[lines.length - 1]); } catch {}
  }

  if (!entry?.sessionId || !entry?.project) return null;

  const filename = `${entry.sessionId}.jsonl`;
  const { projectDir } = resolveProject(entry.project);
  const primary = join(projectDir, filename);
  if (existsSync(primary)) return primary;

  // Search all project dirs as fallback
  try {
    for (const dir of readdirSync(PROJECTS_DIR)) {
      const candidate = join(PROJECTS_DIR, dir, filename);
      if (existsSync(candidate)) return candidate;
    }
  } catch {}

  return null;
}

function collectModifiedFiles(messages: Array<Record<string, any>>): Set<string> {
  const files = new Set<string>();
  for (const m of messages) {
    const content = m.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block.type === "tool_use" && TOOL_NAMES.has(block.name)) {
        const p = block.input?.file_path || block.input?.path;
        if (p) files.add(p);
      }
    }
  }
  return files;
}

function parseJsonLines(raw: string): Array<Record<string, any>> {
  return raw.trim().split("\n")
    .map(line => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean) as Array<Record<string, any>>;
}

async function main(): Promise<void> {
  const raw = await readStdinPassthrough();

  try {
    const parsed = parseHookInput(raw);
    if (!parsed) return;

    const { input, cwd } = parsed;
    const { name, projectDir } = resolveProject(cwd);
    if (!existsSync(projectDir)) mkdirSync(projectDir, { recursive: true });

    const tPath = findTranscriptPath(input.transcript_path, input.session_id);
    if (!tPath) return;

    const messages = parseJsonLines(readFileSync(tPath, "utf-8"));
    if (messages.length < 3) return;

    const progressFile = join(projectDir, "context-progress.md");

    // Deduplicate by session_id
    const sessionTag = input.session_id ? input.session_id.substring(0, 8) : null;
    const existing = readFileSafe(progressFile);
    if (sessionTag && existing.includes(sessionTag)) return;

    const filesModified = collectModifiedFiles(messages);
    const today = new Date().toISOString().split("T")[0];
    const tagPart = sessionTag ? ` [${sessionTag}]` : "";

    const sessionLine = filesModified.size > 0
      ? `✓ [${today}]${tagPart} Modified: ${[...filesModified].slice(0, MAX_DISPLAY_FILES).map(f => f.replace(homedir(), "~")).join(", ")}`
      : `✓ [${today}]${tagPart} Session (read-only, ${messages.length} messages)`;

    appendLine(progressFile, sessionLine);

    // Trim to last N lines
    const content = readFileSafe(progressFile);
    const lines = content.split("\n").filter(Boolean);
    if (lines.length > MAX_PROGRESS_LINES) {
      writeFileSync(progressFile, lines.slice(-MAX_PROGRESS_LINES).join("\n") + "\n");
    }

    console.error(`[UpdateContext] context-progress.md updated for ${name}`);
  } catch (err) {
    console.error("[UpdateContext] Error:", err);
  }
}

main();
