/**
 * context.ts — Per-project context items (goals, decisions, progress, gotchas)
 * Replaces the 4 per-project Markdown context files.
 * Used by: PreCompact, UpdateContext, Cleanup, SessionStart hooks.
 */
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CLAUDE_DIR = join(homedir(), ".claude");
const DB_PATH    = join(CLAUDE_DIR, "memory", "ltm.db");
const SCHEMA_PATH = join(CLAUDE_DIR, "memory", "schema.sql");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");

export type ContextType = "goal" | "decision" | "progress" | "gotcha";

export interface ContextItem {
  id: number;
  project_name: string;
  type: ContextType;
  content: string;
  session_id: string | null;
  permanent: number;
  created_at: string;
}

let _db: Database | null = null;

function getDb(): Database {
  if (_db) return _db;
  const dir = join(CLAUDE_DIR, "memory");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  _db = new Database(DB_PATH, { create: true });
  _db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  const schema = readFileSync(SCHEMA_PATH, "utf-8");
  _db.exec(schema);
  return _db;
}

/**
 * Add a context item for a project.
 * - goal: one row per project (delete+insert to maintain uniqueness)
 * - decision/gotcha: permanent=1, append only
 * - progress: permanent=0, dedup by session_id
 */
export function addItem(
  project: string,
  type: ContextType,
  content: string,
  sessionId?: string
): void {
  const db = getDb();

  if (type === "goal") {
    // Replace the existing goal for this project
    db.run(`DELETE FROM context_items WHERE type='goal' AND project_name=?`, [project]);
    db.run(
      `INSERT INTO context_items (project_name, type, content, session_id, permanent)
       VALUES (?, 'goal', ?, ?, 0)`,
      [project, content, sessionId ?? null]
    );
  } else if (type === "decision" || type === "gotcha") {
    db.run(
      `INSERT INTO context_items (project_name, type, content, session_id, permanent)
       VALUES (?, ?, ?, ?, 1)`,
      [project, type, content, sessionId ?? null]
    );
  } else {
    // progress — dedup by session_id
    if (sessionId) {
      const existing = db.query<{ id: number }, [string, string]>(
        `SELECT id FROM context_items WHERE type='progress' AND project_name=? AND session_id=? LIMIT 1`
      ).get(project, sessionId);
      if (existing) return;
    }
    db.run(
      `INSERT INTO context_items (project_name, type, content, session_id, permanent)
       VALUES (?, 'progress', ?, ?, 0)`,
      [project, content, sessionId ?? null]
    );
  }

  exportContextMarkdown(project);
}

/**
 * Retrieve context items for a project, optionally filtered by type.
 */
export function getItems(
  project: string,
  type?: ContextType,
  limit?: number
): ContextItem[] {
  const db = getDb();

  if (type === "progress") {
    const cap = limit ?? 20;
    const rows = db.query<ContextItem, [string]>(
      `SELECT * FROM context_items WHERE type='progress' AND project_name=?
       ORDER BY id DESC LIMIT ${cap}`
    ).all(project);
    return rows.reverse();
  }

  if (type) {
    return db.query<ContextItem, [string, string]>(
      `SELECT * FROM context_items WHERE type=? AND project_name=? ORDER BY id ASC`
    ).all(type, project);
  }

  return db.query<ContextItem, [string]>(
    `SELECT * FROM context_items WHERE project_name=? ORDER BY id ASC`
  ).all(project);
}

/**
 * Trim progress items to last N for a project.
 */
export function trimProgress(project: string, max = 20): void {
  const db = getDb();
  db.run(
    `DELETE FROM context_items WHERE type='progress' AND project_name=? AND id NOT IN
     (SELECT id FROM context_items WHERE type='progress' AND project_name=? ORDER BY id DESC LIMIT ?)`,
    [project, project, max]
  );
}

/**
 * Export context-summary.md for a project from DB contents.
 * Keeps the file as a human-readable snapshot and backward-compat fallback.
 */
export function exportContextMarkdown(project: string): void {
  const projectDir = join(PROJECTS_DIR, project);
  if (!existsSync(projectDir)) mkdirSync(projectDir, { recursive: true });

  const goals     = getItems(project, "goal");
  const decisions = getItems(project, "decision");
  const progress  = getItems(project, "progress", 20);
  const gotchas   = getItems(project, "gotcha");

  const timestamp = new Date().toISOString().replace("T", " ").replace(/\..+/, "");

  function section(label: string, items: ContextItem[], budget: number): string {
    if (items.length === 0) return "";
    const lines = items.map(i => i.content);
    const available = Math.max(0, budget - 3); // header(2) + trailing blank
    if (lines.length <= available) {
      return [`## ${label}`, "", ...lines, ""].join("\n");
    }
    const kept = lines.slice(-available);
    const omitted = lines.length - available;
    return [`## ${label}`, "", ...kept, `… (${omitted} more entries not shown)`, ""].join("\n");
  }

  const summary = [
    `# Context Summary\n**Project:** ${project}\n**Compaction checkpoint:** ${timestamp}\n`,
    section("Current Goal",        goals,     10),
    section("Recent Progress",     progress,  20),
    section("Key Decisions",       decisions, 15),
    section("Gotchas / Watch Out", gotchas,   15),
  ].join("");

  writeFileSync(join(projectDir, "context-summary.md"), summary);
}
