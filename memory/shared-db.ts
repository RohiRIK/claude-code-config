/**
 * shared-db.ts — Single DB singleton shared by db.ts and context.ts.
 * Prevents dual write connections that break WAL.
 */
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CLAUDE_DIR = join(homedir(), ".claude");
export const DB_PATH = join(CLAUDE_DIR, "memory", "ltm.db");
const SCHEMA_PATH = join(CLAUDE_DIR, "memory", "schema.sql");

let _db: Database | null = null;

export function getDb(): Database {
  if (_db) return _db;
  const dir = join(CLAUDE_DIR, "memory");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  _db = new Database(DB_PATH, { create: true });
  _db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  _db.exec(readFileSync(SCHEMA_PATH, "utf-8"));
  try {
    _db.exec("ALTER TABLE context_items ADD COLUMN memory_id INTEGER REFERENCES memories(id) ON DELETE SET NULL");
  } catch { /* column already exists */ }
  return _db;
}
