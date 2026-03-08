---
name: ContinuousLearning
description: Manages memory persistence, session context, and automated learning from past interactions.
version: 2.0.0
---

# Continuous Learning

## Description
This skill acts as the "Hippocampus" of the system. It handles:
1. **Memory Persistence**: Saving and loading session context (SQLite-backed).
2. **Strategic Compaction**: Suggesting when to clear context to maintain performance.
3. **Pattern Extraction**: Analyzing completed sessions to learn from mistakes and successes.
4. **Long-Term Memory**: Global + project-scoped learned insights with FTS5 and graph relations.

## Memory Architecture

```
~/.claude/memory/
├── schema.sql          # DB schema (committed)
├── ltm.db              # SQLite binary (gitignored)
├── db.ts               # Global memories (learn/recall/forget/relate)
├── context.ts          # Per-project context items (goals/decisions/progress/gotchas)
├── dedup.ts            # Content normalization for dedup keys
└── migrate.ts          # One-time migration from .md files
```

### Two Tables

| Table | Purpose | Managed by |
|-------|---------|------------|
| `memories` | Global + project learned insights | `/learn`, `/recall`, `/forget`, `/relate` |
| `context_items` | Per-project goals/decisions/progress/gotchas | Hooks (automatic) |

## LTM Commands

### `/learn` — Store an insight
Use after discovering a non-trivial pattern, gotcha, preference, or architecture decision.
- Dedup-safe: calling twice reinforces the existing memory (`confirm_count++`)
- No confirmation step needed

### `/recall [query]` — Search memories
Use **before** starting work on a topic to surface relevant past decisions.
- FTS5 full-text search + tag + category filters
- Shows graph neighbours (related memories)

### `/forget <id>` — Delete a memory
Use when a memory is wrong or stale. CASCADE removes all its relations.
- Requires explicit ID — use `/recall` first to find it
- Irreversible — confirm with user

### `/relate <src_id> <tgt_id> <type>` — Link two memories
Use when you recognize a conceptual connection between existing memories.
- Types: `supports | contradicts | refines | depends_on | related_to | supersedes`

## Context Items (Automatic — No Manual Write Needed)

Context items (goals, decisions, progress, gotchas) are now managed entirely by hooks:
- `UpdateContext` (Stop hook) → writes `progress` to DB after each session
- `PreCompact` → reads DB → regenerates `context-summary.md`
- `Cleanup` (Stop hook) → trims progress to last 20 items
- `SessionStart` → regenerates summary from DB → injects at session start

You can still manually write to context files using Edit/Write tools if needed,
but the hooks will pick up DB state on the next session automatically.

## Hook Integration

| Hook | Trigger | LTM Action |
|------|---------|------------|
| `SessionStart` | Session begin | Inject context-summary + importance-5 globals + top-15 project memories |
| `UpdateContext` | Stop (session end) | Write progress item to `context_items` |
| `PreCompact` | Before compaction | Read `context_items` → regenerate `context-summary.md` |
| `Cleanup` | Stop (last) | `trimProgress()` in DB, delete stale project dirs |
| `EvaluateSession` | Stop | Extract raw patterns to `skills/Learned/patterns/` (unchanged) |

## SessionStart LTM Injection Format

```
## Long-Term Memory

**Global (importance ★★★★★):**
- [id] memory content

**Project: <name>**
- [id] memory content ★★★☆☆
```

Max 30 lines injected. Only importance=5 globals + top-15 project-scoped memories.

## Workflow Routing

| Trigger phrase | Action |
|----------------|--------|
| "Learn this", "Remember this", "Save this pattern" | Run `/learn` |
| "What do I know about X?", "Any past decisions on Y?" | Run `/recall` |
| "Forget about X", "That memory is wrong" | Run `/forget` |
| "X supports Y", "X contradicts Y" | Run `/relate` |
| "Run the CaptureLesson workflow" | Run `/learn` |

## Migration

To import existing `.md` context files and learned patterns into the DB:
```bash
bun ~/.claude/memory/migrate.ts
```
Run once. Safe to re-run — duplicate content is detected and skipped.
