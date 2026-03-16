/**
 * embeddings.ts — Provider-agnostic embedding utilities for LTM semantic search.
 * Reads provider config from ltm.db settings table (same source as the graph UI).
 * Supported providers: gemini | openai | openrouter | cohere | ollama
 * Falls back gracefully (returns null) when no provider is configured.
 */
import type { Database } from "bun:sqlite";

// --- Provider config ---

type EmbedProvider = "gemini" | "openai" | "openrouter" | "cohere" | "ollama";

interface ProviderConfig {
  provider: EmbedProvider;
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

function getSetting(db: Database, key: string): string | null {
  return db.query<{ value: string }, [string]>(
    `SELECT value FROM settings WHERE key=?`
  ).get(key)?.value ?? null;
}

function getProviderConfig(): ProviderConfig | null {
  try {
    const { getDb } = require("./shared-db.js") as typeof import("./shared-db.js");
    const db = getDb();

    // Env var overrides DB provider
    const provider = (
      process.env.LTM_EMBED_PROVIDER ??
      getSetting(db, "ltm.embed.provider") ??
      "gemini"
    ) as EmbedProvider;

    switch (provider) {
      case "gemini":
        return {
          provider,
          apiKey: process.env.GEMINI_API_KEY ?? getSetting(db, "ltm.gemini.apiKey") ?? undefined,
          model: process.env.GEMINI_EMBED_MODEL ?? getSetting(db, "ltm.gemini.embedModel") ?? "gemini-embedding-2-preview",
        };
      case "openai":
        return {
          provider,
          apiKey: process.env.OPENAI_API_KEY ?? getSetting(db, "ltm.openai.apiKey") ?? undefined,
          model: process.env.OPENAI_EMBED_MODEL ?? getSetting(db, "ltm.openai.embedModel") ?? "text-embedding-3-small",
        };
      case "openrouter":
        return {
          provider,
          apiKey: process.env.OPENROUTER_API_KEY ?? getSetting(db, "ltm.openrouter.apiKey") ?? undefined,
          model: getSetting(db, "ltm.openrouter.embedModel") ?? "openai/text-embedding-3-large",
          baseUrl: "https://openrouter.ai/api/v1",
        };
      case "cohere":
        return {
          provider,
          apiKey: process.env.COHERE_API_KEY ?? getSetting(db, "ltm.cohere.apiKey") ?? undefined,
          model: getSetting(db, "ltm.cohere.embedModel") ?? "embed-v4.0",
        };
      case "ollama":
        return {
          provider,
          model: getSetting(db, "ltm.ollama.embedModel") ?? "nomic-embed-text",
          baseUrl: getSetting(db, "ltm.ollama.baseUrl") ?? "http://localhost:11434",
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// --- Math utils ---

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

// --- Provider-specific embed implementations ---

// Cached Gemini client
let _genAI: import("@google/generative-ai").GoogleGenerativeAI | null = null;

async function embedGemini(text: string, cfg: ProviderConfig): Promise<Float32Array | null> {
  if (!cfg.apiKey) return null;
  if (!_genAI) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    _genAI = new GoogleGenerativeAI(cfg.apiKey);
  }
  const model = _genAI.getGenerativeModel({ model: cfg.model });
  const result = await model.embedContent(text);
  return new Float32Array(result.embedding.values);
}

async function embedOpenAICompat(text: string, cfg: ProviderConfig): Promise<Float32Array | null> {
  if (!cfg.apiKey) return null;
  const baseUrl = cfg.baseUrl ?? "https://api.openai.com/v1";
  const res = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: cfg.model, input: text }),
  });
  if (!res.ok) throw new Error(`${cfg.provider} API error: ${res.status} ${await res.text()}`);
  const json = await res.json() as { data: Array<{ embedding: number[] }> };
  return new Float32Array(json.data[0]!.embedding);
}

async function embedCohere(text: string, cfg: ProviderConfig): Promise<Float32Array | null> {
  if (!cfg.apiKey) return null;
  const res = await fetch("https://api.cohere.com/v2/embed", {
    method: "POST",
    headers: { "Authorization": `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: cfg.model, texts: [text], input_type: "search_document", embedding_types: ["float"] }),
  });
  if (!res.ok) throw new Error(`cohere API error: ${res.status} ${await res.text()}`);
  const json = await res.json() as { embeddings: { float: number[][] } };
  return new Float32Array(json.embeddings.float[0]!);
}

async function embedOllama(text: string, cfg: ProviderConfig): Promise<Float32Array | null> {
  const res = await fetch(`${cfg.baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: cfg.model, input: text }),
  });
  if (!res.ok) throw new Error(`ollama API error: ${res.status} ${await res.text()}`);
  const json = await res.json() as { embeddings: number[][] };
  return new Float32Array(json.embeddings[0]!);
}

// --- Public API ---

/**
 * Embed text using the configured provider (reads from ltm.db settings).
 * Returns null on missing config or API error — enables graceful fallback.
 */
export async function embedText(text: string): Promise<Float32Array | null> {
  const cfg = getProviderConfig();
  if (!cfg) return null;

  try {
    switch (cfg.provider) {
      case "gemini":    return await embedGemini(text, cfg);
      case "openai":    return await embedOpenAICompat(text, cfg);
      case "openrouter": return await embedOpenAICompat(text, cfg);
      case "cohere":    return await embedCohere(text, cfg);
      case "ollama":    return await embedOllama(text, cfg);
      default:          return null;
    }
  } catch (e) {
    process.stderr.write(`[embeddings] embedText error (${cfg.provider}): ${e}\n`);
    return null;
  }
}

/**
 * Embed a memory by ID and write the embedding BLOB back to DB.
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
