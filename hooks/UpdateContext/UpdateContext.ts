#!/usr/bin/env bun
// UpdateContext Stop Hook
// Appends session progress (files modified, date) to context-progress.md
// at the end of each session. Reads the transcript to find modified files.

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, sep } from "path";
import { homedir } from "os";

const CLAUDE_DIR = join(homedir(), ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");

function deriveSlug(cwd: string): string {
  return cwd.replace(new RegExp("\\" + sep, "g"), "-").replace(/\./g, "-");
}

function readFileSafe(path: string): string {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8").trim();
}

function appendLine(path: string, line: string) {
  const existing = readFileSafe(path);
  const newContent = existing ? `${existing}\n${line}\n` : `${line}\n`;
  writeFileSync(path, newContent);
}

async function findTranscript(
  transcriptPath: string | undefined,
  sessionId: string | undefined
): Promise<string | null> {
  if (transcriptPath && existsSync(transcriptPath)) return transcriptPath;

  const historyFile = join(CLAUDE_DIR, "history.jsonl");
  if (!existsSync(historyFile)) return null;

  const lines = readFileSync(historyFile, "utf-8").trim().split("\n");
  let entry: any = null;

  if (sessionId) {
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const l = JSON.parse(lines[i]);
        if (l.sessionId === sessionId) { entry = l; break; }
      } catch (_) {}
    }
  } else {
    try { entry = JSON.parse(lines[lines.length - 1]); } catch (_) {}
  }

  if (!entry?.sessionId || !entry?.project) return null;

  const filename = `${entry.sessionId}.jsonl`;
  const slug = deriveSlug(entry.project);
  let path = join(PROJECTS_DIR, slug, filename);

  if (!existsSync(path)) {
    const { readdirSync } = await import("fs");
    try {
      for (const dir of readdirSync(PROJECTS_DIR)) {
        const candidate = join(PROJECTS_DIR, dir, filename);
        if (existsSync(candidate)) { path = candidate; break; }
      }
    } catch (_) {}
  }

  return existsSync(path) ? path : null;
}

async function main() {
  let inputStr = "";
  try {
    for await (const chunk of Bun.stdin.stream()) {
      inputStr += new TextDecoder().decode(chunk);
      process.stdout.write(chunk);
    }
  } catch (_) {}

  try {
    let input: any = {};
    try { input = JSON.parse(inputStr); } catch (_) {}

    const cwd: string = input.cwd || input.working_directory || input.session?.cwd || "";
    if (!cwd) return;

    const slug = deriveSlug(cwd);
    const projectDir = join(PROJECTS_DIR, slug);
    if (!existsSync(projectDir)) mkdirSync(projectDir, { recursive: true });

    // Find and parse transcript
    const tPath = await findTranscript(input.transcript_path, input.session_id);
    if (!tPath) return;

    const messages = readFileSync(tPath, "utf-8")
      .trim().split("\n")
      .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
      .filter(Boolean);

    if (messages.length < 3) return;

    // Collect files modified this session
    const filesModified = new Set<string>();
    messages.forEach((m: any) => {
      const content = m.message?.content;
      if (!Array.isArray(content)) return;
      content.forEach((block: any) => {
        if (block.type === "tool_use" && (block.name === "Write" || block.name === "Edit" || block.name === "MultiEdit")) {
          const p = block.input?.file_path || block.input?.path;
          if (p) filesModified.add(p);
        }
      });
    });

    const today = new Date().toISOString().split("T")[0];
    const progressFile = join(projectDir, "context-progress.md");

    // Deduplicate by session_id — skip if this session was already logged
    const sessionTag = input.session_id ? input.session_id.substring(0, 8) : null;
    const existingContent = readFileSafe(progressFile);
    if (sessionTag && existingContent.includes(sessionTag)) return;

    const sessionLine = filesModified.size > 0
      ? `✓ [${today}]${sessionTag ? ` [${sessionTag}]` : ""} Modified: ${[...filesModified].slice(0, 5).map(f => f.replace(homedir(), "~")).join(", ")}`
      : `✓ [${today}]${sessionTag ? ` [${sessionTag}]` : ""} Session (read-only, ${messages.length} messages)`;

    appendLine(progressFile, sessionLine);

    // Trim context-progress.md to last 20 lines (non-blank)
    const content = readFileSafe(progressFile);
    const lines = content.split("\n").filter(Boolean);
    if (lines.length > 20) {
      writeFileSync(progressFile, lines.slice(-20).join("\n") + "\n");
    }

    console.error(`[UpdateContext] context-progress.md updated for ${slug}`);
  } catch (err) {
    console.error("[UpdateContext] Error:", err);
  }
}

main();
