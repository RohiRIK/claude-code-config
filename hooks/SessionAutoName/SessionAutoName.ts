#!/usr/bin/env bun
/**
 * SessionAutoName.ts — Auto-generate concise session names (Ghostty-compatible)
 *
 * TRIGGER: UserPromptSubmit
 *
 * On the FIRST user prompt of a session:
 * - Generates a 2-3 word title via Claude API (haiku, fast)
 * - Stores name in ~/.claude/tmp/session-names.json
 * - Sets Ghostty/terminal tab title via OSC escape code
 *
 * On subsequent prompts: no-op (name already set).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const NAMES_FILE = join(homedir(), ".claude", "tmp", "session-names.json");
const API_KEY = process.env.ANTHROPIC_API_KEY;

interface HookInput {
  session_id?: string;
  prompt?: string;
  user_prompt?: string;
}

type SessionNames = Record<string, string>;

function readNames(): SessionNames {
  try {
    if (existsSync(NAMES_FILE)) return JSON.parse(readFileSync(NAMES_FILE, "utf-8"));
  } catch { /* corrupted — start fresh */ }
  return {};
}

function writeNames(names: SessionNames): void {
  const dir = join(homedir(), ".claude", "tmp");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(NAMES_FILE, JSON.stringify(names, null, 2), "utf-8");
}

/** Set terminal tab title via OSC escape code — works in Ghostty, iTerm2, most modern terminals */
function setTabTitle(title: string): void {
  process.stderr.write(`\x1b]0;${title}\x07`);
}

/** Strip technical noise before sending to LLM */
function sanitize(prompt: string): string {
  return prompt
    .replace(/<[^>]+>/g, " ")           // XML tags
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, " ") // UUIDs
    .replace(/\b[0-9a-f]{7,}\b/gi, " ") // hex IDs
    .replace(/(?:\/[\w.-]+){2,}/g, " ")  // file paths
    .replace(/\s+/g, " ")
    .trim();
}

/** Deterministic fallback: first meaningful word + "Session" */
const NOISE = new Set(["the","a","an","i","my","we","you","fix","add","run","use","get","set","make","help","need","want","please","check","build","create","update","work","do","can","is","are","in","on","for","to","of","with","and","or","but","this","that","how","what","why"]);

function fallbackName(prompt: string): string {
  const word = prompt.replace(/[^a-zA-Z\s]/g, " ").split(/\s+/)
    .find(w => w.length >= 4 && !NOISE.has(w.toLowerCase()));
  if (!word) return "New Session";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + " Session";
}

/** Call Claude haiku to generate a 2-3 word title */
async function generateName(prompt: string): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 20,
        system: `Give this conversation a 2-3 word Topic Case title (e.g. "Voice Server Fix", "Dashboard Redesign", "Hook Permissions"). Must be a coherent noun phrase. No verbs, no articles. Output ONLY the title.`,
        messages: [{ role: "user", content: prompt.slice(0, 600) }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { content: Array<{ text: string }> };
    const raw = data.content?.[0]?.text?.trim().replace(/^["']|["']$/g, "").replace(/[.!?,]/g, "");
    if (!raw) return null;
    const words = raw.split(/\s+/).slice(0, 3);
    if (words.length < 2 || words.some(w => w.length < 3)) return null;
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  } catch {
    return null;
  }
}

async function readStdin(): Promise<HookInput | null> {
  try {
    let data = "";
    for await (const chunk of Bun.stdin.stream()) {
      data += new TextDecoder().decode(chunk);
    }
    return data.trim() ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function main() {
  const input = await readStdin();
  if (!input?.session_id) process.exit(0);

  const { session_id, prompt, user_prompt } = input;
  const names = readNames();

  // Already named — no-op
  if (names[session_id]) {
    setTabTitle(names[session_id]);
    process.exit(0);
  }

  const rawPrompt = sanitize(prompt || user_prompt || "");
  if (!rawPrompt) process.exit(0);

  const name = (await generateName(rawPrompt)) ?? fallbackName(rawPrompt);
  names[session_id] = name;
  writeNames(names);
  setTabTitle(name);
  process.stderr.write(`[SessionAutoName] Named: "${name}"\n`);
  process.exit(0);
}

main().catch(() => process.exit(0));
