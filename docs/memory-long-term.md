# Layer 3: Long-Term Memory (LTM)

SQLite-backed persistent memory with intelligent management.
Two loops: session context (per-project) and global learned insights.
Phase 2 adds a janitor agent for autonomous memory maintenance.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LTM System                                   │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────────┐  │
│  │  context_items│    │   memories   │    │    janitor agent      │  │
│  │  (per-project)│    │   (global)   │    │  ┌─────────────────┐ │  │
│  │              │    │              │    │  │ decay           │ │  │
│  │  goals       │───▶│  preference  │    │  │ promote         │ │  │
│  │  decisions   │    │  architecture│    │  │ dedup           │ │  │
│  │  progress    │    │  gotcha      │    │  │ supersedes      │ │  │
│  │  gotchas     │    │  pattern     │    │  └─────────────────┘ │  │
│  │              │    │  workflow    │    │         │             │  │
│  │              │    │  constraint  │    │    ┌────▼────┐        │  │
│  │  status:     │    │              │    │    │embeddings│       │  │
│  │   active     │    │  status:     │    │    │ (vector) │       │  │
│  │   pending_   │    │   active     │    │    └─────────┘        │  │
│  │   promotion  │    │   pending    │    │         │             │  │
│  │   promoted   │    │   deprecated │    │    ┌────▼────┐        │  │
│  │              │    │   superseded │    │    │providers │       │  │
│  └──────────────┘    └──────────────┘    │    │ gemini   │       │  │
│         │                   ▲            │    │ openrouter│      │  │
│         │    promote()      │            │    │ ollama   │       │  │
│         └───────────────────┘            │    └─────────┘        │  │
│                                          └───────────────────────┘  │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │   settings   │    │     tags     │    │  relations    │           │
│  │  (key-value) │    │ (many:many)  │    │ (knowledge    │           │
│  │              │    │              │    │  graph edges) │           │
│  └──────────────┘    └──────────────┘    └──────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Session Context Loop

Per-project context persists across sessions via `context_items`:

```
  Session N                          Session N+1
  ─────────                          ───────────
  ┌─────────┐   UpdateContext    ┌─────────────┐   SessionStart
  │  Claude  │──────────────────▶│ context_items│──────────────▶ injected
  │  session │   (hook writes    │   in SQLite  │   (hook reads   into new
  │         │    decisions,      │              │    & formats)    session
  │         │    gotchas, etc.)  │              │
  └─────────┘                    └─────────────┘
       │                               │
       │  PreCompact                   │  EvaluateSession
       │  (assembles summary           │  (extracts patterns
       │   before /compact)            │   → memories table)
       ▼                               ▼
  context-summary.md              memories table
```

### Context Item Types

| Type | Purpose | Permanent |
|------|---------|-----------|
| `goal` | What the project is trying to achieve | No |
| `decision` | Architectural/design choices made | Yes |
| `progress` | What was done this session | No |
| `gotcha` | Pitfalls and things to watch out for | Yes |

---

## Phase 2: Janitor Agent

The janitor runs inside `server.ts` (shares the DB instance) and performs
four autonomous maintenance tasks:

```
                    ┌─────────────────────┐
                    │   Janitor Agent      │
                    │   (runs in server)   │
                    └──────┬──────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
     ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
     │   DECAY   │  │  PROMOTE  │  │   DEDUP   │
     │           │  │           │  │           │
     │ Unused    │  │ Decisions │  │ Semantic  │
     │ memories  │  │ & gotchas │  │ similarity│
     │ lose      │  │ auto-     │  │ detection │
     │ confidence│  │ elevate   │  │ via embed │
     │ over time │  │ to global │  │ + LLM     │
     │           │  │ memories  │  │ merge     │
     │ Archive   │  │           │  │           │
     │ at 0.2    │  │ Links     │  │ Cosine    │
     │ threshold │  │ memory_id │  │ similarity│
     └───────────┘  └───────────┘  └─────┬─────┘
                                         │
                                   ┌─────▼─────┐
                                   │ SUPERSEDES │
                                   │            │
                                   │ New memory │
                                   │ marks old  │
                                   │ as replaced│
                                   │            │
                                   │ Creates    │
                                   │ 'supersedes│
                                   │  relation  │
                                   └────────────┘
```

### Janitor Pipeline

1. **Decay** — Scans memories not used within the configured window.
   Reduces `confidence` by a configurable rate. When confidence drops
   below threshold (default 0.2), status changes to `deprecated`.

2. **Promote** — Finds `context_items` of type `decision` or `gotcha`
   that haven't been promoted yet. Creates a corresponding memory and
   links back via `memory_id`. Status changes to `promoted`.

3. **Dedup** — Computes embedding vectors for all memories. Finds pairs
   with cosine similarity above threshold (default 0.85). Sends the
   pair to an LLM to produce a merged version. Result creates a
   `pending_action` for human review.

4. **Supersedes** — When dedup merges produce a new memory, the old
   memories are marked `status: superseded` and a `supersedes` relation
   is created in `memory_relations`.

### Embedding Providers

```
  ┌─────────────────────────────────────────────────┐
  │              Embedding Pipeline                   │
  │                                                   │
  │  memory.content ──▶ provider.embed() ──▶ BLOB    │
  │                                          (f32)   │
  │                                                   │
  │  Providers:                                       │
  │  ┌──────────┐  ┌────────────┐  ┌──────────┐     │
  │  │  Gemini  │  │ OpenRouter │  │  Ollama  │     │
  │  │          │  │            │  │  (local) │     │
  │  │ text-    │  │ configur-  │  │          │     │
  │  │ embedding│  │ able model │  │ nomic/   │     │
  │  │ -004     │  │            │  │ mxbai    │     │
  │  └──────────┘  └────────────┘  └──────────┘     │
  │                                                   │
  │  Similarity: cosine(a, b) in TypeScript           │
  │  Storage: Float32Array → SQLite BLOB              │
  └─────────────────────────────────────────────────┘
```

---

## Graph Visualizer

The LTM graph renders all data as an interactive D3 force graph:

```
  Server (Bun)              Graph App (Next.js 15)
  :7331                     :7332
  ┌──────────────┐          ┌──────────────────────────┐
  │ /api/graph   │◀────────▶│  D3 Force Graph          │
  │ /api/stats   │  proxy   │  ┌────────────────────┐  │
  │ /api/tags    │          │  │ ● Project nodes    │  │
  │ /api/search  │          │  │ ○ Memory nodes     │  │
  │ /api/project │          │  │ · Context nodes    │  │
  │ /api/settings│          │  └────────────────────┘  │
  │ /api/janitor │          │                          │
  │ /api/pending │          │  Pages:                  │
  │              │  WS      │  / ........... Main graph│
  │ WebSocket ───┼──────────│  /project/:n . Drill-down│
  │ (live reload)│          │  /settings ... Provider  │
  │              │          │  /pending ... Review UI   │
  └──────────────┘          └──────────────────────────┘
```

### Graph Node Types

```
  ╔═══════════════╗     ━━━━━━━━━━━━━━━━     ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
  ║   PROJECT     ║     ┃   MEMORY     ┃     ┊  CONTEXT     ┊
  ║   (large,     ║     ┃   (medium,   ┃     ┊  (small,     ┊
  ║    glow)      ║     ┃    colored   ┃     ┊   dim)       ┊
  ╚═══════════════╝     ┃    by type)  ┃     ┊              ┊
                        ━━━━━━━━━━━━━━━━     ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄

  Memory colors by category:
    preference   ▓▓ sky-400       architecture ▓▓ violet-400
    gotcha       ▓▓ amber-400     pattern      ▓▓ emerald-400
    workflow     ▓▓ rose-400      constraint   ▓▓ orange-400
```

### Graph Features

| Feature | Description |
|---------|-------------|
| Tag filter | Sidebar chips — dims non-matching nodes to 15% |
| Spotlight search | Cmd+K — FTS5-powered, keyboard nav, zoom-to-node |
| Project drill-down | Click project node — radial layout sub-graph |
| Node legend | Collapsible color legend, bottom-left |
| WebSocket | Live refresh on DB changes |
| Neural layout | Organic clustering, no rigid ring orbits |

---

## Settings UI (`/settings`)

Configure janitor behavior and embedding providers:

```
  ┌─────────────────────────────────────────────┐
  │  Settings                                    │
  │                                              │
  │  Embedding Provider    [Gemini      ▾]       │
  │  Embedding Model       [text-embedding-004]  │
  │  LLM Provider          [Gemini      ▾]       │
  │  LLM Model             [gemini-2.0-flash]    │
  │                                              │
  │  ── Decay ──────────────────────────────     │
  │  Decay Rate            [0.05        ]        │
  │  Decay Window (days)   [30          ]        │
  │  Archive Threshold     [0.2         ]        │
  │                                              │
  │  ── Dedup ──────────────────────────────     │
  │  Similarity Threshold  [0.85        ]        │
  │                                              │
  │  ── Auto-Run ───────────────────────────     │
  │  Auto-run Interval     [6h          ]        │
  │                                              │
  │  [Save Settings]                             │
  └─────────────────────────────────────────────┘
```

---

## Pending Actions UI (`/pending`)

Review janitor suggestions before they take effect:

```
  ┌─────────────────────────────────────────────┐
  │  Pending Actions                    (3 new)  │
  │                                              │
  │  ┌─────────────────────────────────────────┐ │
  │  │ MERGE  #42 + #89                        │ │
  │  │ "bun preferred over npm" ≈              │ │
  │  │ "always use bun not npm"                │ │
  │  │ Similarity: 0.92                        │ │
  │  │ Proposed: "bun is always preferred..."  │ │
  │  │                                         │ │
  │  │ [✓ Approve]  [✗ Reject]                 │ │
  │  └─────────────────────────────────────────┘ │
  │                                              │
  │  ┌─────────────────────────────────────────┐ │
  │  │ DEPRECATE  #13                          │ │
  │  │ "Recent Sessions 2026-01-22..."         │ │
  │  │ Confidence: 0.18 (below threshold)      │ │
  │  │                                         │ │
  │  │ [✓ Approve]  [✗ Reject]                 │ │
  │  └─────────────────────────────────────────┘ │
  └─────────────────────────────────────────────┘
```

---

## Schema (Phase 2 additions)

```sql
-- memories: new columns
status       TEXT DEFAULT 'active'  -- active|pending|deprecated|superseded
embedding    BLOB                   -- Float32Array for vector search
last_used_at TEXT DEFAULT now()     -- for decay calculations

-- context_items: new columns
memory_id    INTEGER REFERENCES memories(id)  -- link to promoted memory
status       TEXT DEFAULT 'active'            -- active|pending_promotion|promoted

-- settings: new table
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT DEFAULT now()
);

-- memory_relations: new type
'supersedes' added to relationship_type CHECK constraint
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/learn` | Store a new pattern or insight in LTM |
| `/recall` | Search long-term memory before starting work |
| `/forget` | Remove a memory by ID |
| `/relate` | Create a relation between two memories |
| `/init-context` | Seed initial context for a new project |
| `/update-context` | Extract decisions/gotchas from current session |
| `/check-context` | Verify context matches disk state |

---

## Hooks

| Hook | Trigger | LTM Action |
|------|---------|------------|
| `SessionStart` | Session begins | Injects context summary |
| `UpdateContext` | `/update-context` | Writes context_items to DB |
| `PreCompact` | Before `/compact` | Assembles context-summary.md |
| `EvaluateSession` | Session ends | Extracts patterns → memories |
| `NotifyLtmServer` | After DB writes | Broadcasts WS refresh |
| `Cleanup` | Session ends | Trims old progress entries |

---

## File Structure

```
memory/
├── ltm.db              # SQLite database (WAL mode)
├── schema.sql          # Full schema (idempotent)
├── shared-db.ts        # DB singleton + migrations + settings helpers
├── server.ts           # Bun API server (:7331) + janitor host
├── db.ts               # Memory CRUD operations
├── context.ts          # Context item operations + promote
├── migrate.ts          # One-shot: JSON → SQLite migration
├── backfill-promote.ts # One-shot: promote existing context_items
│
├── janitor/
│   ├── index.ts        # Orchestrator (run all tasks, auto-run timer)
│   ├── decay.ts        # Confidence decay logic
│   ├── promote.ts      # Auto-promote decisions/gotchas
│   ├── dedup.ts        # Semantic dedup via embeddings
│   ├── supersedes.ts   # Mark old memories as superseded
│   ├── embeddings.ts   # Vector operations + cosine similarity
│   └── providers/
│       ├── types.ts    # Provider interfaces + setting keys
│       ├── gemini.ts   # Google Gemini embedding + LLM
│       ├── openrouter.ts # OpenRouter embedding + LLM
│       └── ollama.ts   # Local Ollama embedding + LLM
│
├── graph-app/          # Next.js 15 visualization
│   ├── app/
│   │   ├── page.tsx        # Main graph view
│   │   ├── pending/page.tsx    # Pending actions review
│   │   └── settings/page.tsx   # Provider/decay settings
│   ├── components/
│   │   ├── Graph.tsx       # D3 force graph
│   │   ├── StatsBar.tsx    # Memory/context counts + pending badge
│   │   ├── SettingsForm.tsx # Settings form component
│   │   └── ...
│   └── lib/
│       ├── api.ts          # API client (fetch + WS)
│       └── types.ts        # Shared TypeScript types
│
└── docs/
    └── memory-long-term.md # This file
```
