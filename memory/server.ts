/**
 * server.ts — LTM Graph Visualization Server
 * Bun.serve() on port 7331 with WebSocket live-reload and fs.watch DB change detection.
 */
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, watch } from "fs";
import { join } from "path";
import { CLAUDE_DIR } from "../hooks/lib/resolveProject.js";

const DB_PATH = join(CLAUDE_DIR, "memory", "ltm.db");
const SCHEMA_PATH = join(CLAUDE_DIR, "memory", "schema.sql");
const UI_PATH = join(CLAUDE_DIR, "memory", "graph-ui", "index.html");
const PID_PATH = join(CLAUDE_DIR, "tmp", "ltm-server.pid");
const PORT = 7331;

// Cache schema at startup — it never changes at runtime
const SCHEMA = readFileSync(SCHEMA_PATH, "utf-8");

// Ensure tmp dir and write PID
mkdirSync(join(CLAUDE_DIR, "tmp"), { recursive: true });
await Bun.write(PID_PATH, String(process.pid));

// Persistent read-only DB — opened once, PRAGMAs run once
const db = new Database(DB_PATH, { readonly: true });
db.exec("PRAGMA journal_mode=WAL;");
db.exec("PRAGMA foreign_keys=ON;");
db.exec(SCHEMA);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function queryDb<T = unknown>(sql: string, params: any[] = []): T[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.query<T, any>(sql).all(...params);
}

function truncate(s: string, len: number): string {
  return s.length > len ? s.substring(0, len) + "…" : s;
}

function parseTags(raw: string | null): string[] {
  return raw ? raw.split(",").filter(Boolean) : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function queryOne<T = unknown>(sql: string, params: any[] = []): T | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.query<T, any>(sql).get(...params) ?? null;
}

// Graph data — includes memory nodes + project nodes (negative IDs) + all edges
function getGraphData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memories = db.query<{
    id: number; content: string; category: string; importance: number;
    project_scope: string | null; confidence: number; confirm_count: number;
    source: string | null; dedup_key: string | null; last_confirmed_at: string;
    created_at: string; tags: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, any>(`
    SELECT m.id, m.content, m.category, m.importance, m.project_scope,
           m.confidence, m.confirm_count, m.source, m.dedup_key,
           m.last_confirmed_at, m.created_at,
           GROUP_CONCAT(t.name, ',') as tags
    FROM memories m
    LEFT JOIN memory_tags mt ON m.id = mt.memory_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    GROUP BY m.id
  `).all();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memLinks = db.query<{ source: number; target: number; type: string; relation_id: number; created_at: string }, any>(
    `SELECT id as relation_id, source_memory_id as source, target_memory_id as target, relationship_type as type, created_at FROM memory_relations`
  ).all();

  // Project nodes — one per unique project_name, negative IDs (-1 to -N)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = db.query<{ name: string; goal: string | null; item_count: number }, any>(`
    SELECT c.project_name as name,
           (SELECT content FROM context_items WHERE project_name=c.project_name AND type='goal' LIMIT 1) as goal,
           COUNT(*) as item_count
    FROM context_items c
    GROUP BY c.project_name
    ORDER BY c.project_name
  `).all();

  const projectNodes = projects.map((p, i) => ({
    id: -(i + 1),
    label: p.name,
    content: p.goal ?? p.name,
    category: "project",
    importance: 5,
    project_scope: null,
    confidence: 1,
    confirm_count: p.item_count,
    created_at: "",
    tags: [],
    is_project: true,
  }));
  const projectIdMap = new Map(projectNodes.map(p => [p.label, p.id]));

  // Context item nodes — IDs: -(1000 + ctx.id), so no collision with project nodes (-1 to -N)
  // Include goals, decisions, gotchas in full; limit progress to last 5 per project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctxItems = db.query<{ id: number; project_name: string; type: string; content: string; session_id: string | null; permanent: number; created_at: string }, any>(`
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
  `).all();

  const ctxNodes = ctxItems.map(c => ({
    id: -(1000 + c.id),
    label: truncate(c.content, 55),
    content: c.content,
    category: c.type,          // "goal" | "decision" | "gotcha" | "progress"
    importance: c.type === "goal" ? 3 : 2,
    project_scope: c.project_name,
    confidence: 1,
    confirm_count: 0,
    session_id: c.session_id,
    permanent: Boolean(c.permanent),
    created_at: c.created_at,
    tags: [],
    is_context: true,
  }));

  // Edges: memory → project (project_scope), context_item → project (context_of)
  const projectEdges: { source: number; target: number; type: string }[] = [];
  for (const m of memories) {
    const pid = projectIdMap.get(m.project_scope ?? "");
    if (pid !== undefined) projectEdges.push({ source: pid, target: m.id, type: "project_scope" });
  }
  for (const c of ctxNodes) {
    const pid = projectIdMap.get(c.project_scope ?? "");
    if (pid !== undefined) projectEdges.push({ source: pid, target: c.id, type: "context_of" });
  }

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

function getContextData() {
  return queryDb(
    `SELECT project_name, type, content, created_at FROM context_items ORDER BY project_name, type, id DESC`
  );
}

function getStats() {
  const row = queryOne<{ memories: number; relations: number; projects: number; context_items: number; tags: number }>(`
    SELECT
      (SELECT COUNT(*) FROM memories) as memories,
      (SELECT COUNT(*) FROM memory_relations) as relations,
      (SELECT COUNT(DISTINCT project_name) FROM context_items) as projects,
      (SELECT COUNT(*) FROM context_items) as context_items,
      (SELECT COUNT(*) FROM tags) as tags
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
  const m = queryOne<{ id: number; content: string; category: string; importance: number; project_scope: string | null; confidence: number; confirm_count: number; source: string | null; dedup_key: string | null; last_confirmed_at: string; created_at: string }>(
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

  const memories = queryDb<{
    id: number; content: string; category: string; importance: number;
    confidence: number; confirm_count: number; source: string | null;
    dedup_key: string | null; last_confirmed_at: string; created_at: string; tags: string | null;
  }>(
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

  const ctxRows = queryDb<{ id: number; type: string; content: string; session_id: string | null; permanent: number; created_at: string }>(
    `SELECT id, type, content, session_id, permanent, created_at FROM context_items WHERE project_name=? ORDER BY type, id DESC`,
    [projectName]
  );
  const context_items = ctxRows.map(c => ({
    id: -(1000 + c.id),
    label: truncate(c.content, 55),
    content: c.content,
    category: c.type,
    importance: c.type === "goal" ? 3 : 2,
    confidence: 1,
    confirm_count: 0,
    project_scope: projectName,
    session_id: c.session_id,
    permanent: Boolean(c.permanent),
    created_at: c.created_at,
    tags: [],
    is_context: true as const,
  }));

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
  // Use FTS5 full-text index for ranked, efficient search
  return queryDb<{ id: number; content: string; category: string; importance: number; project_scope: string | null }>(
    `SELECT m.id, m.content, m.category, m.importance, m.project_scope
     FROM memories_fts
     JOIN memories m ON memories_fts.rowid = m.id
     WHERE memories_fts MATCH ?
     ORDER BY rank
     LIMIT 50`,
    [q]
  );
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
let watchDebounce: ReturnType<typeof setTimeout> | null = null;
if (existsSync(DB_PATH)) {
  watch(DB_PATH, () => {
    if (watchDebounce) clearTimeout(watchDebounce);
    watchDebounce = setTimeout(() => broadcast({ type: "refresh" }), 300);
  });
}

Bun.serve({
  port: PORT,

  routes: {
    "/": () => new Response(Bun.file(UI_PATH), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
    "/api/graph": () => Response.json(getGraphData()),
    "/api/context": () => Response.json(getContextData()),
    "/api/context/:project": req => Response.json(getProjectContext(decodeURIComponent(req.params.project))),
    "/api/stats": () => Response.json(getStats()),
    "/api/tags": () => Response.json(getTags()),
    "/api/memory/:id": req => {
      const id = parseInt(req.params.id, 10);
      const m = getMemoryById(id);
      return m ? Response.json(m) : new Response("Not found", { status: 404 });
    },
    "/api/search": req => {
      const q = new URL(req.url).searchParams.get("q") ?? "";
      return Response.json(q.length >= 2 ? searchMemories(q) : []);
    },
    "/api/project/:name": req => Response.json(getProjectDetail(decodeURIComponent(req.params.name))),
    "/api/reload": { POST: () => { broadcast({ type: "refresh" }); return Response.json({ ok: true }); } },
  },

  websocket: {
    open(ws) { clients.add(ws); ws.send(JSON.stringify({ type: "connected" })); },
    close(ws) { clients.delete(ws); },
    message() {},
  },

  fetch(req, server) {
    if (req.headers.get("upgrade") === "websocket") {
      const ok = server.upgrade(req);
      if (!ok) return new Response("WebSocket upgrade failed", { status: 400 });
      return undefined as unknown as Response;
    }
    return new Response("Not found", { status: 404 });
  },
});

console.log(`🧠 LTM Graph running on http://localhost:${PORT}`);
console.log(`   PID: ${process.pid} — saved to ${PID_PATH}`);
