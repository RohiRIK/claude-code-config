/**
 * server.ts — LTM Graph Visualization Server
 * Bun.serve() on port 7331 with WebSocket live-reload and fs.watch DB change detection.
 * Phase 2: includes janitor routes (settings, pending, approve, dedup, decay).
 */
import type { SQLQueryBindings } from "bun:sqlite";
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, watch } from "fs";
import { dirname, join } from "path";

import { CLAUDE_DIR } from "../hooks/lib/resolveProject.js";
import { getAllSettings, getSetting, setSetting } from "./shared-db.js";
import { learn } from "./db.js";
import {
  approveMemory,
  getEmbeddingProvider,
  getJanitorStatus,
  getPendingMemories,
  mergeMemories,
  parseDedupSource,
  rejectMemory,
  runJanitor,
  semanticSearch,
  startAutoRun,
  supersede,
} from "./janitor/index.js";
import { semanticSearch } from "./janitor/embeddings.js";
import { SETTING_DEFAULTS, SETTING_KEYS } from "./janitor/providers/types.js";
import { anthropicLLM } from "./janitor/providers/anthropic.js";
import { cohereEmbedding } from "./janitor/providers/cohere.js";
import { geminiEmbedding } from "./janitor/providers/gemini.js";
import { ollamaEmbedding } from "./janitor/providers/ollama.js";
import { openaiEmbedding } from "./janitor/providers/openai.js";
import { openrouterEmbedding } from "./janitor/providers/openrouter.js";

/** Provider instances indexed by provider id, used by the /api/settings/verify route. */
const PROVIDER_VERIFY_MAP: Record<string, { verify(): Promise<{ ok: boolean; error?: string }> }> = {
  gemini: geminiEmbedding,
  openai: openaiEmbedding,
  anthropic: anthropicLLM,
  cohere: cohereEmbedding,
  openrouter: openrouterEmbedding,
  ollama: ollamaEmbedding,
};

/** Fetch real model lists from each provider's API after successful key verification. */
async function fetchProviderModels(
  provider: string,
  key: string,
): Promise<{ embedModels: string[]; llmModels: string[] }> {
  const empty = { embedModels: [] as string[], llmModels: [] as string[] };

  try {
    if (provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=100`,
      );
      if (!res.ok) return empty;
      const data = (await res.json()) as {
        models: Array<{ name: string; supportedGenerationMethods: string[] }>;
      };
      const embedModels = data.models
        .filter((m) => m.supportedGenerationMethods.includes("embedContent") || m.supportedGenerationMethods.includes("batchEmbedContents"))
        .map((m) => m.name.replace("models/", ""));
      const llmModels = data.models
        .filter((m) => m.supportedGenerationMethods.includes("generateContent"))
        .map((m) => m.name.replace("models/", ""))
        .filter((n) => !n.includes("embedding") && !n.includes("aqa"));
      return { embedModels, llmModels };
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) return empty;
      const data = (await res.json()) as { data: Array<{ id: string }> };
      const ids = data.data.map((m) => m.id).sort();
      const embedModels = ids.filter((id) => id.startsWith("text-embedding"));
      const llmModels = ids.filter(
        (id) => id.startsWith("gpt-") || id.startsWith("o1") || id.startsWith("o3") || id.startsWith("o4"),
      );
      return { embedModels, llmModels };
    }

    if (provider === "anthropic") {
      // Anthropic has no public model list API — return well-known models
      return {
        embedModels: [],
        llmModels: [
          "claude-haiku-4-5-20251001",
          "claude-sonnet-4-6",
          "claude-opus-4-6",
          "claude-3-5-haiku-20241022",
          "claude-3-5-sonnet-20241022",
        ],
      };
    }

    if (provider === "cohere") {
      const res = await fetch("https://api.cohere.com/v2/models?page_size=50", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) return empty;
      const data = (await res.json()) as {
        models: Array<{ name: string; endpoints: string[] }>;
      };
      const embedModels = data.models
        .filter((m) => m.endpoints.includes("embed"))
        .map((m) => m.name);
      const llmModels = data.models
        .filter((m) => m.endpoints.includes("chat"))
        .map((m) => m.name);
      return { embedModels, llmModels };
    }

    if (provider === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) return empty;
      const data = (await res.json()) as { data: Array<{ id: string }> };
      const ids = data.data.map((m) => m.id).sort();
      const embedModels = ids.filter((id) => id.includes("embedding"));
      const llmModels = ids.filter((id) => !id.includes("embedding"));
      return { embedModels, llmModels };
    }

    if (provider === "ollama") {
      const baseUrl = getSetting("ltm.ollama.baseUrl") || "http://localhost:11434";
      const res = await fetch(`${baseUrl}/api/tags`).catch(() => null);
      if (!res?.ok) return empty;
      const data = (await res.json()) as { models: Array<{ name: string }> };
      const names = data.models.map((m) => m.name).sort();
      return { embedModels: names, llmModels: names };
    }
  } catch {
    // fall through to empty
  }
  return empty;
}

const SRC_DIR = import.meta.dir; // directory of this file (memory/)
const DB_PATH = join(CLAUDE_DIR, "memory", "ltm.db");
const SCHEMA_PATH = join(SRC_DIR, "schema.sql");
const UI_PATH = join(SRC_DIR, "graph-ui", "index.html");
const PID_PATH = join(CLAUDE_DIR, "tmp", "ltm-server.pid");
const PORT = Number(process.env.PORT) || 7331;

// Cache schema at startup — it never changes at runtime
const SCHEMA = readFileSync(SCHEMA_PATH, "utf-8");

// Ensure tmp dir and write PID
mkdirSync(join(CLAUDE_DIR, "tmp"), { recursive: true });
await Bun.write(PID_PATH, String(process.pid));

// Persistent DB — opened once, PRAGMAs run once
const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode=WAL;");
db.exec("PRAGMA foreign_keys=ON;");
db.exec(SCHEMA);

type Params = SQLQueryBindings[];

function queryDb<T = unknown>(sql: string, params: Params = []): T[] {
  return db.query<T, Params>(sql).all(...params);
}

function truncate(s: string, len: number): string {
  return s.length > len ? s.substring(0, len) + "…" : s;
}

function parseTags(raw: string | null): string[] {
  return raw ? raw.split(",").filter(Boolean) : [];
}

function queryOne<T = unknown>(sql: string, params: Params = []): T | null {
  return db.query<T, Params>(sql).get(...params) ?? null;
}

type MemoryRow = {
  id: number; content: string; category: string; importance: number;
  project_scope: string | null; confidence: number; confirm_count: number;
  source: string | null; dedup_key: string | null; last_confirmed_at: string;
  created_at: string; tags: string | null;
};

type CtxRow = {
  id: number; project_name: string; type: string; content: string;
  session_id: string | null; permanent: number; created_at: string;
};

function getMemoriesWithTags(): MemoryRow[] {
  return queryDb<MemoryRow>(`
    SELECT m.id, m.content, m.category, m.importance, m.project_scope,
           m.confidence, m.confirm_count, m.source, m.dedup_key,
           m.last_confirmed_at, m.created_at,
           GROUP_CONCAT(t.name, ',') as tags
    FROM memories m
    LEFT JOIN memory_tags mt ON m.id = mt.memory_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    WHERE m.status = 'active'
    GROUP BY m.id
  `);
}

function getProjectNodes() {
  const projects = queryDb<{ name: string; goal: string | null; item_count: number }>(`
    SELECT c.project_name as name,
           (SELECT content FROM context_items WHERE project_name=c.project_name AND type='goal' LIMIT 1) as goal,
           COUNT(*) as item_count
    FROM context_items c
    GROUP BY c.project_name
    ORDER BY c.project_name
  `);

  return projects.map((p, i) => ({
    id: -(i + 1),
    label: p.name,
    content: p.goal ?? p.name,
    category: "project",
    importance: 5,
    project_scope: null,
    confidence: 1,
    confirm_count: p.item_count,
    created_at: "",
    tags: [] as string[],
    is_project: true,
  }));
}

function getContextNodes(): Array<ReturnType<typeof toCtxNode>> {
  const rows = queryDb<CtxRow>(`
    WITH ranked_progress AS (
      SELECT id, project_name, type, content, session_id, permanent, created_at,
             ROW_NUMBER() OVER (PARTITION BY project_name ORDER BY id DESC) AS rn
      FROM context_items WHERE type='progress'
    )
    SELECT id, project_name, type, content, session_id, permanent, created_at
    FROM context_items WHERE type IN ('goal','decision','gotcha')
    UNION ALL
    SELECT id, project_name, type, content, session_id, permanent, created_at
    FROM ranked_progress WHERE rn <= 5
    ORDER BY project_name, type, id
  `);
  return rows.map(toCtxNode);
}

function toCtxNode(c: CtxRow) {
  return {
    id: -(1000 + c.id),
    label: truncate(c.content, 55),
    content: c.content,
    category: c.type,
    importance: c.type === "goal" ? 3 : 2,
    project_scope: c.project_name,
    confidence: 1,
    confirm_count: 0,
    session_id: c.session_id,
    permanent: Boolean(c.permanent),
    created_at: c.created_at,
    tags: [] as string[],
    is_context: true,
  };
}

function buildProjectEdges(
  memories: MemoryRow[],
  ctxNodes: Array<{ id: number; project_scope: string | null }>,
  projectIdMap: Map<string, number>,
): Array<{ source: number; target: number; type: string }> {
  const edges: Array<{ source: number; target: number; type: string }> = [];
  for (const m of memories) {
    const pid = projectIdMap.get(m.project_scope ?? "");
    if (pid !== undefined) edges.push({ source: pid, target: m.id, type: "project_scope" });
  }
  for (const c of ctxNodes) {
    const pid = projectIdMap.get(c.project_scope ?? "");
    if (pid !== undefined) edges.push({ source: pid, target: c.id, type: "context_of" });
  }
  return edges;
}

function getGraphData() {
  const memories = getMemoriesWithTags();
  const memLinks = queryDb<{ source: number; target: number; type: string; relation_id: number; created_at: string }>(
    `SELECT id as relation_id, source_memory_id as source, target_memory_id as target, relationship_type as type, created_at FROM memory_relations`
  );
  const projectNodes = getProjectNodes();
  const projectIdMap = new Map(projectNodes.map(p => [p.label, p.id]));
  const ctxNodes = getContextNodes();
  const projectEdges = buildProjectEdges(memories, ctxNodes, projectIdMap);

  return {
    nodes: [
      ...projectNodes,
      ...ctxNodes,
      ...memories.map(m => ({
        id: m.id,
        label: truncate(m.content, 60),
        content: m.content,
        category: m.category,
        importance: m.importance,
        project_scope: m.project_scope,
        confidence: m.confidence,
        confirm_count: m.confirm_count,
        source: m.source,
        dedup_key: m.dedup_key,
        last_confirmed_at: m.last_confirmed_at,
        created_at: m.created_at,
        tags: parseTags(m.tags),
      })),
    ],
    links: [...memLinks, ...projectEdges],
  };
}

// Context items for a specific project (for sidebar)
function getProjectContext(projectName: string) {
  const rows = queryDb<{ type: string; content: string }>(
    `SELECT type, content FROM context_items WHERE project_name=? ORDER BY type, id DESC`,
    [projectName]
  );
  const grouped: Record<string, string[]> = { goal: [], decision: [], gotcha: [], progress: [] };
  for (const r of rows) { (grouped[r.type] ??= []).push(r.content); }
  return grouped;
}

function getStats() {
  const row = queryOne<{ memories: number; relations: number; projects: number; context_items: number; tags: number; pending: number }>(`
    SELECT
      (SELECT COUNT(*) FROM memories WHERE status IN ('active', 'pending')) as memories,
      (SELECT COUNT(*) FROM memory_relations) as relations,
      (SELECT COUNT(DISTINCT project_name) FROM context_items) as projects,
      (SELECT COUNT(*) FROM context_items) as context_items,
      (SELECT COUNT(*) FROM tags) as tags,
      (SELECT COUNT(*) FROM memories WHERE status = 'pending') as pending
  `);
  const byCategory = queryDb<{ category: string; cnt: number }>(
    `SELECT category, COUNT(*) as cnt FROM memories GROUP BY category`
  );
  const byProject = queryDb<{ project_scope: string; cnt: number }>(
    `SELECT project_scope, COUNT(*) as cnt FROM memories WHERE project_scope IS NOT NULL GROUP BY project_scope`
  );
  return {
    memories: row?.memories ?? 0,
    relations: row?.relations ?? 0,
    projects: row?.projects ?? 0,
    context_items: row?.context_items ?? 0,
    tags: row?.tags ?? 0,
    pending: row?.pending ?? 0,
    by_category: Object.fromEntries(byCategory.map(r => [r.category, r.cnt])),
    by_project: Object.fromEntries(byProject.map(r => [r.project_scope, r.cnt])),
  };
}

function getTags() {
  return queryDb<{ id: number; name: string; memory_count: number }>(
    `SELECT t.id, t.name, COUNT(mt.memory_id) as memory_count FROM tags t LEFT JOIN memory_tags mt ON t.id=mt.tag_id GROUP BY t.id ORDER BY memory_count DESC`
  );
}

function getMemoryById(id: number) {
  const m = queryOne<Omit<MemoryRow, "tags">>(
    `SELECT id, content, category, importance, project_scope, confidence, confirm_count, source, dedup_key, last_confirmed_at, created_at FROM memories WHERE id=?`,
    [id]
  );
  if (!m) return null;
  const tags = queryDb<{ name: string }>(
    `SELECT t.name FROM tags t JOIN memory_tags mt ON t.id=mt.tag_id WHERE mt.memory_id=?`,
    [id]
  ).map(r => r.name);
  const relations = queryDb<{ related_id: number; type: string; direction: string }>(`
    SELECT target_memory_id as related_id, relationship_type as type, 'outgoing' as direction FROM memory_relations WHERE source_memory_id=?
    UNION ALL
    SELECT source_memory_id as related_id, relationship_type as type, 'incoming' as direction FROM memory_relations WHERE target_memory_id=?
  `, [id, id]);
  return { ...m, tags, relations };
}

function getProjectDetail(projectName: string) {
  const context = getProjectContext(projectName);

  const memories = queryDb<MemoryRow>(
    `SELECT m.id, m.content, m.category, m.importance, m.confidence, m.confirm_count,
            m.source, m.dedup_key, m.last_confirmed_at, m.created_at,
            GROUP_CONCAT(t.name, ',') as tags
     FROM memories m
     LEFT JOIN memory_tags mt ON m.id = mt.memory_id
     LEFT JOIN tags t ON mt.tag_id = t.id
     WHERE m.project_scope = ?
     GROUP BY m.id
     ORDER BY m.importance DESC, m.id DESC`,
    [projectName]
  ).map(m => ({
    ...m,
    label: truncate(m.content, 60),
    project_scope: projectName,
    tags: parseTags(m.tags),
  }));

  const ctxRows = queryDb<CtxRow>(
    `SELECT id, project_name, type, content, session_id, permanent, created_at FROM context_items WHERE project_name=? ORDER BY type, id DESC`,
    [projectName]
  );
  const context_items = ctxRows.map(toCtxNode);

  const relations = queryDb<{ source: number; target: number; type: string; relation_id: number }>(
    `SELECT r.id as relation_id, r.source_memory_id as source, r.target_memory_id as target, r.relationship_type as type
     FROM memory_relations r
     WHERE r.source_memory_id IN (SELECT id FROM memories WHERE project_scope = ?)
        OR r.target_memory_id IN (SELECT id FROM memories WHERE project_scope = ?)`,
    [projectName, projectName]
  );

  return { name: projectName, context, memories, context_items, relations };
}

function searchMemories(q: string) {
  try {
    return queryDb<{ id: number; content: string; category: string; importance: number; project_scope: string | null }>(
      `SELECT m.id, m.content, m.category, m.importance, m.project_scope
       FROM memories_fts
       JOIN memories m ON memories_fts.rowid = m.id
       WHERE memories_fts MATCH ?
       ORDER BY rank
       LIMIT 50`,
      [q]
    );
  } catch {
    return [];
  }
}

// WebSocket clients — typed to the minimal interface we actually use
type WsClient = { send(data: string): void };
const clients = new Set<WsClient>();

function broadcast(data: object): void {
  const msg = JSON.stringify(data);
  for (const ws of clients) {
    try { ws.send(msg); } catch { clients.delete(ws); }
  }
}

// Watch DB for changes and broadcast refresh
// WAL writes go to ltm.db-wal, not ltm.db — watch the WAL file (or dir as fallback)
let watchDebounce: ReturnType<typeof setTimeout> | null = null;
if (existsSync(DB_PATH)) {
  const watchTarget = existsSync(DB_PATH + "-wal") ? DB_PATH + "-wal" : dirname(DB_PATH);
  watch(watchTarget, { recursive: false }, () => {
    if (watchDebounce) clearTimeout(watchDebounce);
    watchDebounce = setTimeout(() => broadcast({ type: "refresh" }), 300);
  });
}

Bun.serve({
  port: PORT,

  websocket: {
    open(ws) { clients.add(ws); ws.send(JSON.stringify({ type: "connected" })); },
    close(ws) { clients.delete(ws); },
    message() {},
  },

  async fetch(req, server) {
    if (req.headers.get("upgrade") === "websocket") {
      const ok = server.upgrade(req);
      if (!ok) return new Response("WebSocket upgrade failed", { status: 400 });
      return undefined as unknown as Response;
    }

    const url = new URL(req.url);
    const p = url.pathname;

    if (p === "/")                     return new Response(Bun.file(UI_PATH), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    if (p === "/api/graph")            return Response.json(getGraphData());
    if (p === "/api/stats")            return Response.json(getStats());
    if (p === "/api/tags")             return Response.json(getTags());
    if (p === "/api/search") {
      const q = url.searchParams.get("q") ?? "";
      return Response.json(q.length >= 2 ? searchMemories(q) : []);
    }
    if (p === "/api/reload" && req.method === "POST") {
      broadcast({ type: "refresh" });
      return Response.json({ ok: true });
    }

    const ctxMatch = p.match(/^\/api\/context\/(.+)$/);
    if (ctxMatch?.[1]) return Response.json(getProjectContext(decodeURIComponent(ctxMatch[1])));

    const memMatch = p.match(/^\/api\/memory\/(\d+)$/);
    if (memMatch?.[1]) {
      const m = getMemoryById(parseInt(memMatch[1], 10));
      return m ? Response.json(m) : new Response("Not found", { status: 404 });
    }

    const projMatch = p.match(/^\/api\/project\/(.+)$/);
    if (projMatch?.[1]) return Response.json(getProjectDetail(decodeURIComponent(projMatch[1])));

    // ============================================================
    // Phase 2: Settings routes
    // ============================================================

    if (p === "/api/settings" && req.method === "GET") {
      const stored = getAllSettings();
      // Merge with defaults so the UI always sees every key
      const merged: Record<string, string> = { ...SETTING_DEFAULTS, ...stored };
      return Response.json(merged);
    }

    if (p === "/api/settings" && req.method === "PUT") {
      try {
        const body = (await req.json()) as Record<string, string>;
        for (const [key, value] of Object.entries(body)) {
          if (typeof key === "string" && typeof value === "string") {
            setSetting(key, value);
          }
        }
        broadcast({ type: "settings-updated" });
        return Response.json({ ok: true });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 400 });
      }
    }

    if (p === "/api/settings/models" && req.method === "GET") {
      return Response.json({
        embeddingProviders: ["gemini", "openai", "cohere", "openrouter", "ollama"],
        llmProviders: ["gemini", "openai", "anthropic", "cohere", "openrouter", "ollama"],
        embedModels: {
          gemini: ["text-embedding-004", "text-embedding-005", "gemini-embedding-exp-03-07"],
          openai: ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"],
          cohere: ["embed-v4.0", "embed-multilingual-v3.0", "embed-english-v3.0"],
          openrouter: ["openai/text-embedding-3-small", "openai/text-embedding-3-large"],
          ollama: ["nomic-embed-text", "mxbai-embed-large", "all-minilm", "snowflake-arctic-embed"],
        },
        llmModels: {
          gemini: ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-flash"],
          openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini"],
          anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-6"],
          cohere: ["command-r-plus", "command-r", "command-a-03-2025"],
          openrouter: ["google/gemini-2.0-flash-001", "openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct"],
          ollama: ["llama3.2", "llama3.1", "mistral", "phi4", "qwen2.5"],
        },
        defaults: SETTING_DEFAULTS,
      });
    }

    if (p === "/api/settings/verify" && req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({})) as { provider?: string; key?: string };
        // If caller provides key + provider, persist it first (avoids client-side extra PUT round-trip)
        if (body.provider && body.key) {
          const keySettingMap: Record<string, string> = {
            gemini: SETTING_KEYS.GEMINI_API_KEY,
            openai: SETTING_KEYS.OPENAI_API_KEY,
            anthropic: SETTING_KEYS.ANTHROPIC_API_KEY,
            cohere: SETTING_KEYS.COHERE_API_KEY,
            openrouter: SETTING_KEYS.OPENROUTER_API_KEY,
          };
          const settingKey = keySettingMap[body.provider];
          if (settingKey) setSetting(settingKey, body.key);
        }
        const provider = body.provider
          ? (PROVIDER_VERIFY_MAP[body.provider] ?? null)
          : getEmbeddingProvider();
        if (!provider) {
          return Response.json({ ok: false, error: `Unknown provider: ${body.provider}` });
        }
        const result = await provider.verify();
        if (result.ok && body.provider && body.key) {
          const models = await fetchProviderModels(body.provider, body.key);
          return Response.json({ ...result, ...models });
        }
        return Response.json(result);
      } catch (e) {
        return Response.json({ ok: false, error: String(e) });
      }
    }

    // ============================================================
    // Phase 2: Janitor routes
    // ============================================================

    if (p === "/api/janitor/status" && req.method === "GET") {
      return Response.json(getJanitorStatus());
    }

    if (p === "/api/janitor/run" && req.method === "POST") {
      const status = getJanitorStatus();
      if (status.running) {
        return Response.json({ ok: false, error: "Janitor already running" }, { status: 409 });
      }
      // Fire-and-forget — LLM dedup can take >10s, respond immediately
      runJanitor().then(result => {
        broadcast({ type: "janitor-complete", result });
      }).catch(() => {});
      return Response.json({ ok: true, started: true });
    }

    // ============================================================
    // Phase 2: Pending memories routes
    // ============================================================

    if (p === "/api/pending" && req.method === "GET") {
      return Response.json(getPendingMemories());
    }

    const approveMatch = p.match(/^\/api\/memory\/(\d+)\/approve$/);
    if (approveMatch?.[1] && req.method === "POST") {
      const id = parseInt(approveMatch[1], 10);
      const mem = queryOne<{ source: string | null }>(
        "SELECT source FROM memories WHERE id = ? AND status = 'pending'", [id]
      );
      if (!mem) {
        return Response.json({ ok: false, error: "Not a pending memory" }, { status: 400 });
      }
      const dedupPair = mem.source ? parseDedupSource(mem.source) : null;
      if (dedupPair) {
        mergeMemories(dedupPair.idA, dedupPair.idB);
        db.run("DELETE FROM memories WHERE id = ?", [id]);
        broadcast({ type: "refresh" });
        return Response.json({ ok: true, id, merged: true });
      }
      const ok = approveMemory(id);
      if (ok) {
        broadcast({ type: "refresh" });
        return Response.json({ ok: true, id });
      }
      return Response.json({ ok: false, error: "Not a pending memory" }, { status: 400 });
    }

    // DELETE /api/memory/:id — reject pending memory or delete any memory
    const deleteMemMatch = p.match(/^\/api\/memory\/(\d+)$/);
    if (deleteMemMatch?.[1] && req.method === "DELETE") {
      const id = parseInt(deleteMemMatch[1], 10);
      const mem = queryOne<{ status: string }>("SELECT status FROM memories WHERE id=?", [id]);
      if (!mem) return new Response("Not found", { status: 404 });

      if (mem.status === "pending") {
        rejectMemory(id);
      } else {
        db.run("DELETE FROM memories WHERE id=?", [id]);
      }
      broadcast({ type: "refresh" });
      return Response.json({ ok: true, id });
    }

    // POST /api/memory/:id/supersedes/:targetId
    const supersedesMatch = p.match(/^\/api\/memory\/(\d+)\/supersedes\/(\d+)$/);
    if (supersedesMatch?.[1] && supersedesMatch?.[2] && req.method === "POST") {
      try {
        const newId = parseInt(supersedesMatch[1], 10);
        const oldId = parseInt(supersedesMatch[2], 10);
        supersede(newId, oldId);
        broadcast({ type: "refresh" });
        return Response.json({ ok: true, newId, oldId });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 400 });
      }
    }

    // POST /api/memory/merge — merge two memories
    if (p === "/api/memory/merge" && req.method === "POST") {
      try {
        const body = (await req.json()) as { keepId: number; supersededId: number; mergedContent?: string };
        mergeMemories(body.keepId, body.supersededId, body.mergedContent);
        broadcast({ type: "refresh" });
        return Response.json({ ok: true });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 400 });
      }
    }

    // ============================================================
    // Mobile: learn (add memory) endpoint
    // ============================================================

    if (p === "/api/memory/learn" && req.method === "POST") {
      try {
        const body = (await req.json()) as {
          content: string;
          category?: string;
          importance?: number;
          project_scope?: string | null;
          tags?: string[];
        };
        if (!body.content?.trim()) {
          return Response.json({ ok: false, error: "content is required" }, { status: 400 });
        }
        const result = learn({
          content: body.content.trim(),
          category: (body.category as "pattern") ?? "pattern",
          importance: body.importance ?? 3,
          project_scope: body.project_scope ?? undefined,
          tags: body.tags ?? [],
          source: "mobile-app",
        });
        broadcast({ type: "refresh" });
        return Response.json({ ok: true, ...result });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 400 });
      }
    }

    // ============================================================
    // Phase 3: Semantic search
    // ============================================================

    if (p === "/api/search/semantic" && req.method === "POST") {
      try {
        const { query, limit = 10, minSimilarity = 0.5 } = (await req.json()) as {
          query: string; limit?: number; minSimilarity?: number;
        };
        const results = await semanticSearch(query, limit, minSimilarity);
        return Response.json(results);
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    // ============================================================
    // Phase 3: Dedup merge-all
    // ============================================================

    if (p === "/api/dedup/merge-all" && req.method === "POST") {
      const { minSimilarity = 0.95 } = await req.json().catch(() => ({})) as { minSimilarity?: number };
      const candidates = db.query<
        { id: number; content: string; category: string; source: string; confidence: number },
        []
      >(
        "SELECT id, content, category, source, confidence FROM memories WHERE status = 'pending' AND source LIKE 'dedup:%'"
      ).all();

      let merged = 0;
      let skipped = 0;
      const errors: string[] = [];
      const sentinelIdsToDelete: number[] = [];

      // mergeMemories calls outside the transaction (they manage their own writes)
      for (const candidate of candidates) {
        try {
          const dedupPair = parseDedupSource(candidate.source);
          if (!dedupPair) { skipped++; continue; }
          // similarity is stored directly in the confidence column
          if (candidate.confidence < minSimilarity) { skipped++; continue; }
          mergeMemories(dedupPair.idA, dedupPair.idB);
          sentinelIdsToDelete.push(candidate.id);
          merged++;
        } catch (e) {
          errors.push(String(e));
          skipped++;
        }
      }

      // Batch-delete all processed sentinel rows in one transaction
      if (sentinelIdsToDelete.length > 0) {
        const placeholders = sentinelIdsToDelete.map(() => "?").join(",");
        db.run(`DELETE FROM memories WHERE id IN (${placeholders})`, sentinelIdsToDelete);
      }

      broadcast({ type: "refresh" });
      return Response.json({ merged, skipped, errors });
    }

    // ============================================================
    // Phase 3: Memory health dashboard
    // ============================================================

    if (p === "/api/health" && req.method === "GET") {
      const atRisk = db.query<
        { id: number; content: string; category: string; confidence: number; project_scope: string | null },
        []
      >(
        "SELECT id, content, category, confidence, project_scope FROM memories WHERE status = 'active' AND confidence < 0.3 ORDER BY confidence ASC"
      ).all();
      const distribution = db.query<{ bucket: number; count: number }, []>(
        "SELECT ROUND(confidence, 1) as bucket, COUNT(*) as count FROM memories WHERE status = 'active' GROUP BY bucket ORDER BY bucket"
      ).all();
      const stats = db.query<{ status: string; count: number }, []>(
        "SELECT status, COUNT(*) as count FROM memories GROUP BY status"
      ).all();
      const avgConf = db.query<{ avg: number }, []>(
        "SELECT AVG(confidence) as avg FROM memories WHERE status = 'active'"
      ).get() as { avg: number };
      return Response.json({ atRisk, distribution, stats, avgConf: avgConf?.avg ?? 0 });
    }

    // ============================================================
    // Boost memory confidence
    // ============================================================

    const boostMatch = p.match(/^\/api\/memory\/(\d+)\/boost$/);
    if (boostMatch?.[1] && req.method === "POST") {
      const id = Number(boostMatch[1]);
      db.run("UPDATE memories SET confidence = 0.6, last_confirmed_at = datetime('now') WHERE id = ?", [id]);
      broadcast({ type: "refresh" });
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  },
});

// Start janitor auto-run if configured
startAutoRun();

console.log(`🧠 LTM Graph running on http://localhost:${PORT}`);
console.log(`   PID: ${process.pid} — saved to ${PID_PATH}`);
