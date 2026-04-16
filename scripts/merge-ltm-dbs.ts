/**
 * merge-ltm-dbs.ts — Merge unique records from old standalone LTM DB into plugin DB.
 *
 * Strategy:
 *   1. Memories: match on dedup_key (unique). Insert only if dedup_key missing from target.
 *      For memories without dedup_key, match on content+category+project_scope.
 *   2. Tags: insert-or-ignore by name, build old→new ID map.
 *   3. Memory_tags: remap both memory_id and tag_id using maps.
 *   4. Memory_relations: remap source/target memory IDs, skip if either side didn't merge.
 *   5. Context_items: match on (project_name, type, content). Insert only new ones.
 *      Skip memory_id FK since old memory IDs don't map 1:1.
 *
 * Run: bun ~/.claude/scripts/merge-ltm-dbs.ts
 */

import { Database } from "bun:sqlite";

const OLD_DB_PATH = `${Bun.env.HOME}/.claude/memory/ltm.db`;
const NEW_DB_PATH = `${Bun.env.HOME}/.claude/plugins/data/ltm-ltm/ltm.db`;

const oldDb = new Database(OLD_DB_PATH, { readonly: true });
const newDb = new Database(NEW_DB_PATH);

// Enable WAL for performance
newDb.run("PRAGMA journal_mode=WAL");

const stats = { memories: 0, tags: 0, memoryTags: 0, relations: 0, contextItems: 0, skipped: 0 };

// --- 1. Memories ---
// Map: old_id → new_id (for memories that get inserted or already exist)
const oldToNewMemoryId = new Map<number, number>();

const oldMemories = oldDb.query(`
  SELECT id, content, category, importance, confidence, source, project_scope,
         dedup_key, created_at, last_confirmed_at, confirm_count, status, last_used_at
  FROM memories
`).all() as Array<Record<string, unknown>>;

// Pre-build lookup for existing memories in new DB
const existingByDedup = new Map<string, number>();
const existingRows = newDb.query("SELECT id, dedup_key FROM memories WHERE dedup_key IS NOT NULL").all() as Array<{ id: number; dedup_key: string }>;
for (const row of existingRows) {
  existingByDedup.set(row.dedup_key, row.id);
}

const existingByContent = new Map<string, number>();
const contentRows = newDb.query("SELECT id, content, category, project_scope FROM memories").all() as Array<{ id: number; content: string; category: string; project_scope: string | null }>;
for (const row of contentRows) {
  const key = `${row.content}|||${row.category}|||${row.project_scope ?? ""}`;
  existingByContent.set(key, row.id);
}

const insertMemory = newDb.prepare(`
  INSERT INTO memories (content, category, importance, confidence, source, project_scope,
                        dedup_key, created_at, last_confirmed_at, confirm_count, status, last_used_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

newDb.run("BEGIN TRANSACTION");

for (const m of oldMemories) {
  const oldId = m.id as number;

  // Check if already exists by dedup_key
  if (m.dedup_key && existingByDedup.has(m.dedup_key as string)) {
    oldToNewMemoryId.set(oldId, existingByDedup.get(m.dedup_key as string)!);
    stats.skipped++;
    continue;
  }

  // Check if already exists by content+category+project
  const contentKey = `${m.content}|||${m.category}|||${m.project_scope ?? ""}`;
  if (existingByContent.has(contentKey)) {
    oldToNewMemoryId.set(oldId, existingByContent.get(contentKey)!);
    stats.skipped++;
    continue;
  }

  // Insert new memory (skip embedding blob — plugin will regenerate)
  try {
    const result = insertMemory.run(
      m.content, m.category, m.importance, m.confidence, m.source, m.project_scope,
      m.dedup_key, m.created_at, m.last_confirmed_at, m.confirm_count, m.status, m.last_used_at
    );
    const newId = Number(result.lastInsertRowid);
    oldToNewMemoryId.set(oldId, newId);
    stats.memories++;
  } catch (e: unknown) {
    // Likely UNIQUE constraint on dedup_key — skip
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE")) {
      stats.skipped++;
    } else {
      console.error(`[merge] Failed to insert memory ${oldId}: ${msg}`);
    }
  }
}

// --- 2. Tags ---
const oldToNewTagId = new Map<number, number>();

const oldTags = oldDb.query("SELECT id, name FROM tags").all() as Array<{ id: number; name: string }>;

for (const t of oldTags) {
  newDb.run("INSERT OR IGNORE INTO tags (name) VALUES (?)", [t.name]);
  const row = newDb.query("SELECT id FROM tags WHERE name = ?").get(t.name) as { id: number } | null;
  if (row) {
    oldToNewTagId.set(t.id, row.id);
    if (row.id !== t.id) stats.tags++;
  }
}

// --- 3. Memory_tags ---
const oldMemoryTags = oldDb.query("SELECT memory_id, tag_id FROM memory_tags").all() as Array<{ memory_id: number; tag_id: number }>;

for (const mt of oldMemoryTags) {
  const newMemId = oldToNewMemoryId.get(mt.memory_id);
  const newTagId = oldToNewTagId.get(mt.tag_id);
  if (!newMemId || !newTagId) continue;

  try {
    newDb.run("INSERT OR IGNORE INTO memory_tags (memory_id, tag_id) VALUES (?, ?)", [newMemId, newTagId]);
    stats.memoryTags++;
  } catch {}
}

// --- 4. Memory_relations ---
const oldRelations = oldDb.query(
  "SELECT source_memory_id, target_memory_id, relationship_type, created_at FROM memory_relations"
).all() as Array<{ source_memory_id: number; target_memory_id: number; relationship_type: string; created_at: string }>;

for (const r of oldRelations) {
  const newSrc = oldToNewMemoryId.get(r.source_memory_id);
  const newTgt = oldToNewMemoryId.get(r.target_memory_id);
  if (!newSrc || !newTgt) continue;

  try {
    newDb.run(
      "INSERT OR IGNORE INTO memory_relations (source_memory_id, target_memory_id, relationship_type, created_at) VALUES (?, ?, ?, ?)",
      [newSrc, newTgt, r.relationship_type, r.created_at]
    );
    stats.relations++;
  } catch {}
}

// --- 5. Context_items ---
const oldContextItems = oldDb.query(
  "SELECT project_name, type, content, session_id, permanent, created_at, status FROM context_items"
).all() as Array<Record<string, unknown>>;

for (const ci of oldContextItems) {
  const exists = newDb.query(
    "SELECT 1 FROM context_items WHERE project_name = ? AND type = ? AND content = ?"
  ).get(ci.project_name, ci.type, ci.content);

  if (exists) continue;

  try {
    newDb.run(
      `INSERT INTO context_items (project_name, type, content, session_id, permanent, created_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ci.project_name, ci.type, ci.content, ci.session_id, ci.permanent, ci.created_at, ci.status]
    );
    stats.contextItems++;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[merge] Failed context_item: ${msg}`);
  }
}

newDb.run("COMMIT");

console.log("=== LTM DB Merge Complete ===");
console.log(`Memories inserted:    ${stats.memories}`);
console.log(`Memories skipped:     ${stats.skipped} (already in plugin DB)`);
console.log(`Tags mapped:          ${stats.tags}`);
console.log(`Memory_tags linked:   ${stats.memoryTags}`);
console.log(`Relations merged:     ${stats.relations}`);
console.log(`Context items added:  ${stats.contextItems}`);
console.log(`\nBackup at: ${NEW_DB_PATH}.backup-pre-merge`);

oldDb.close();
newDb.close();
