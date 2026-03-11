import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Memory {
  id: number;
  content: string;
  category: string;
  importance: number;
  confidence: number;
  confirm_count: number;
  project_scope: string | null;
  tags: string[];
  created_at: string;
  source?: string | null;
}

interface MemoryDetail extends Memory {
  relations: Array<{ related_id: number; type: string; direction: string }>;
}

interface Stats {
  memories: number;
  relations: number;
  projects: number;
  context_items: number;
  tags: number;
  pending: number;
  by_category: Record<string, number>;
  by_project: Record<string, number>;
}

interface ProjectDetail {
  name: string;
  context: Record<string, string[]>;
  memories: Memory[];
}

interface SearchResult {
  id: number;
  content: string;
  category: string;
  importance: number;
  project_scope: string | null;
}

// ─── API ────────────────────────────────────────────────────────────────────

const BASE = "/api";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function categoryClass(cat: string): string {
  return `card-category cat-${cat}`;
}

function importanceStars(n: number): string {
  return "\u2605".repeat(n) + "\u2606".repeat(5 - n);
}

function relativeDate(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

type Tab = "memories" | "projects" | "add";

// ─── Components ─────────────────────────────────────────────────────────────

function MemoryCard({ m, onTap }: { m: Memory | SearchResult; onTap: (id: number) => void }) {
  return (
    <div className="card" onClick={() => onTap(m.id)}>
      <div className="card-header">
        <span className={categoryClass(m.category)}>{m.category}</span>
        <span className="card-importance">{importanceStars(m.importance)}</span>
      </div>
      <div className="card-content">{m.content}</div>
      <div className="card-meta">
        {m.project_scope && <span className="card-project">{m.project_scope}</span>}
        {"tags" in m && (m as Memory).tags?.map((t) => (
          <span key={t} className="card-tag">{t}</span>
        ))}
        {"created_at" in m && <span className="card-date">{relativeDate((m as Memory).created_at)}</span>}
      </div>
    </div>
  );
}

function DetailSheet({ id, onClose }: { id: number; onClose: () => void }) {
  const [detail, setDetail] = useState<MemoryDetail | null>(null);

  useEffect(() => {
    void apiGet<MemoryDetail>(`/memory/${id}`).then(setDetail);
  }, [id]);

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        {!detail ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <div className="sheet-meta">
              <span className={categoryClass(detail.category)}>{detail.category}</span>
              <span className="card-importance">{importanceStars(detail.importance)}</span>
              {detail.project_scope && <span className="card-project">{detail.project_scope}</span>}
            </div>
            <div className="sheet-content">{detail.content}</div>
            <div className="card-meta" style={{ marginTop: 12 }}>
              {detail.tags?.map((t) => (
                <span key={t} className="card-tag">{t}</span>
              ))}
              <span className="card-date">confidence: {detail.confidence}</span>
              <span className="card-date">confirmed: {detail.confirm_count}x</span>
              <span className="card-date">{relativeDate(detail.created_at)}</span>
            </div>
            {detail.relations.length > 0 && (
              <div className="sheet-relations">
                <h3>Relations</h3>
                {detail.relations.map((r, i) => (
                  <div key={i} className="relation-item">
                    {r.direction === "outgoing" ? "\u2192" : "\u2190"} {r.type} (#{r.related_id})
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function MemoriesTab({ query }: { query: string }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiGet<{ nodes: Memory[] }>("/graph").then((g) => {
      const mems = (g.nodes as Array<Memory & Record<string, unknown>>)
        .filter((n) => !("is_project" in n) && !("is_context" in n))
        .sort((a, b) => b.importance - a.importance);
      setMemories(mems);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => {
      void apiGet<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`).then(setSearchResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const items = searchResults ?? memories;

  if (loading) return <div className="loading">Loading memories...</div>;
  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">🔍</div>
        <div className="empty-text">{query ? "No results found" : "No memories yet"}</div>
      </div>
    );
  }

  return (
    <>
      {items.map((m) => (
        <MemoryCard key={m.id} m={m} onTap={setSelectedId} />
      ))}
      {selectedId !== null && (
        <DetailSheet id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}

function ProjectsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);

  useEffect(() => {
    void apiGet<Stats>("/stats").then(setStats);
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setDetail(null);
      return;
    }
    void apiGet<ProjectDetail>(`/project/${encodeURIComponent(selectedProject)}`).then(setDetail);
  }, [selectedProject]);

  if (!stats) return <div className="loading">Loading projects...</div>;

  if (selectedProject && detail) {
    return (
      <div>
        <div className="project-detail-header">
          <button className="back-btn" onClick={() => setSelectedProject(null)}>
            {"→"} Back
          </button>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{detail.name}</h2>
        </div>

        {(["goal", "decision", "gotcha", "progress"] as const).map((type) => {
          const items = detail.context[type];
          if (!items?.length) return null;
          return (
            <div key={type} className="context-section">
              <h3>{type === "goal" ? "Goals" : type === "decision" ? "Decisions" : type === "gotcha" ? "Gotchas" : "Progress"}</h3>
              {items.map((item, i) => (
                <div key={i} className="context-item">{item}</div>
              ))}
            </div>
          );
        })}

        {detail.memories.length > 0 && (
          <div className="context-section">
            <h3>Memories ({detail.memories.length})</h3>
            {detail.memories.map((m) => (
              <div key={m.id} className="card">
                <div className="card-header">
                  <span className={categoryClass(m.category)}>{m.category}</span>
                  <span className="card-importance">{importanceStars(m.importance)}</span>
                </div>
                <div className="card-content">{m.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const projects = Object.entries(stats.by_project);
  if (projects.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">📁</div>
        <div className="empty-text">No projects yet</div>
      </div>
    );
  }

  return (
    <>
      {projects.map(([name, count]) => (
        <div key={name} className="project-card" onClick={() => setSelectedProject(name)}>
          <div className="project-name">{name}</div>
          <div className="project-stats">
            <span>{count} memories</span>
          </div>
        </div>
      ))}
    </>
  );
}

function AddTab() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("pattern");
  const [importance, setImportance] = useState("3");
  const [projectScope, setProjectScope] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await apiPost("/memory/learn", {
        content: content.trim(),
        category,
        importance: parseInt(importance, 10),
        project_scope: projectScope.trim() || null,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setContent("");
      setTagsInput("");
      setToast(true);
      setTimeout(() => setToast(false), 2000);
    } finally {
      setSubmitting(false);
    }
  }, [content, category, importance, projectScope, tagsInput, submitting]);

  return (
    <div className="add-form">
      <div className="form-group">
        <label className="form-label">Content</label>
        <textarea
          className="form-textarea"
          placeholder="New memory..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Category</label>
        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="pattern">Pattern</option>
          <option value="architecture">Architecture</option>
          <option value="gotcha">Gotcha</option>
          <option value="workflow">Workflow</option>
          <option value="preference">Preference</option>
          <option value="constraint">Constraint</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Importance (1-5)</label>
        <select className="form-select" value={importance} onChange={(e) => setImportance(e.target.value)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{importanceStars(n)} ({n})</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Project (optional)</label>
        <input
          className="form-input"
          placeholder="project-name"
          value={projectScope}
          onChange={(e) => setProjectScope(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Tags (comma separated)</label>
        <input
          className="form-input"
          placeholder="bun, sqlite, hooks"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
      </div>

      <button className="submit-btn" disabled={!content.trim() || submitting} onClick={handleSubmit}>
        {submitting ? "Saving..." : "Save Memory"}
      </button>

      {toast && <div className="toast">Memory saved!</div>}
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────

function App() {
  const [tab, setTab] = useState<Tab>("memories");
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void apiGet<Stats>("/stats").then(setStats);
  }, []);

  return (
    <div className="app">
      <div className="header">
        <h1>🧠 LTM</h1>
        {stats && (
          <span className="stats-badge">
            {stats.memories} memories | {stats.projects} projects
          </span>
        )}
      </div>

      {tab === "memories" && (
        <div className="search-bar">
          <input
            className="search-input"
            type="search"
            placeholder="Search memories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === "memories" ? "active" : ""}`} onClick={() => setTab("memories")}>
          Memories
        </button>
        <button className={`tab ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")}>
          Projects
        </button>
        <button className={`tab ${tab === "add" ? "active" : ""}`} onClick={() => setTab("add")}>
          + Add
        </button>
      </div>

      <div className="content">
        {tab === "memories" && <MemoriesTab query={query} />}
        {tab === "projects" && <ProjectsTab />}
        {tab === "add" && <AddTab />}
      </div>
    </div>
  );
}

// ─── Mount ──────────────────────────────────────────────────────────────────

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
