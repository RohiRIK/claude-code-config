/**
 * embeddings.ts — Gemini-based embedding utilities for LTM semantic search.
 * Uses text-embedding-004 (768 dims). Gracefully falls back when no API key.
 */
import type { Database } from "bun:sqlite";

const MODEL = "text-embedding-004";
const DIMS = 768;

// Cached client — created once per process
let _genAI: import("@google/generative-ai").GoogleGenerativeAI | null = null;

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] as number;
    const bi = b[i] as number;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function vecToBlob(v: Float32Array): Buffer {
  return Buffer.from(v.buffer);
}

export function blobToVec(b: Buffer): Float32Array {
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
}

/**
 * Embed text using Gemini text-embedding-004.
 * Returns null if GEMINI_API_KEY is not set or on API error.
 */
export async function embedText(text: string): Promise<Float32Array | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    if (!_genAI) {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      _genAI = new GoogleGenerativeAI(apiKey);
    }
    const model = _genAI.getGenerativeModel({ model: MODEL });
    const result = await model.embedContent(text);
    const values = result.embedding.values;
    return new Float32Array(values);
  } catch (e) {
    process.stderr.write(`[embeddings] embedText error: ${e}\n`);
    return null;
  }
}

/**
 * Embed a memory by ID and write the embedding BLOB back to DB.
 * No-op if no API key or memory not found.
 */
export async function embedMemory(db: Database, id: number): Promise<void> {
  const row = db.query<{ content: string }, [number]>(
    `SELECT content FROM memories WHERE id=?`
  ).get(id);
  if (!row) return;

  const vec = await embedText(row.content);
  if (!vec) return;

  db.run(`UPDATE memories SET embedding=? WHERE id=?`, [vecToBlob(vec), id]);
}

/**
 * Back-fill: embed all memories with embedding IS NULL.
 * Processes in batches of 20 with a small delay between batches.
 */
export async function backfill(db: Database): Promise<void> {
  const rows = db.query<{ id: number; content: string }, []>(
    `SELECT id, content FROM memories WHERE embedding IS NULL AND status='active'`
  ).all();

  process.stderr.write(`[embeddings] Back-filling ${rows.length} memories...\n`);

  const BATCH = 20;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await Promise.all(batch.map(async row => {
      const vec = await embedText(row.content);
      if (vec) {
        db.run(`UPDATE memories SET embedding=? WHERE id=?`, [vecToBlob(vec), row.id]);
        done++;
      }
    }));
    process.stderr.write(`[embeddings] ${Math.min(i + BATCH, rows.length)}/${rows.length} done\n`);
    if (i + BATCH < rows.length) await Bun.sleep(200);
  }
  process.stderr.write(`[embeddings] Back-fill complete: ${done}/${rows.length} embedded\n`);
}

// CLI: bun embeddings.ts --backfill
if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.includes("--backfill")) {
    const { getDb } = await import("./shared-db.js");
    const db = getDb();
    await backfill(db);
  } else {
    process.stderr.write("Usage: bun embeddings.ts --backfill\n");
  }
}
