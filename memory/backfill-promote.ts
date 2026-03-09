#!/usr/bin/env bun
// One-time script: promote all context_items decisions/gotchas into memories

import { getDb } from "./shared-db.js";
import { promote } from "./context.js";

const db = getDb();

const items = db.query<{ id: number; type: string; project_name: string; content: string }, []>(
  `SELECT id, type, project_name, content FROM context_items
   WHERE type IN ('decision','gotcha') AND (memory_id IS NULL OR memory_id = 0)
   ORDER BY id ASC`
).all();

console.log(`Found ${items.length} items to promote.`);

let promoted = 0;
let skipped = 0;

for (const item of items) {
  const memId = promote(item.id);
  if (memId !== null) {
    console.log(`  Promoted context_item #${item.id} (${item.type}, ${item.project_name}) → memory #${memId}`);
    promoted++;
  } else {
    console.log(`  Skipped context_item #${item.id} (${item.type})`);
    skipped++;
  }
}

console.log(`\nDone. Promoted: ${promoted}, Skipped: ${skipped}`);

// Verify
const count = db.query<{ count: number }, []>(
  `SELECT COUNT(*) as count FROM context_items WHERE memory_id IS NOT NULL`
).get();
console.log(`Total context_items with memory_id linked: ${count?.count ?? 0}`);
