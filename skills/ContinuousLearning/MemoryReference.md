# MemoryReference — LTM Command Reference

Full reference for `/learn`, `/recall`, `/forget`, `/relate` commands backed by `~/.claude/memory/db.ts`.

## /learn — Store an Insight

**When to use:** After discovering a non-trivial pattern, gotcha, preference, or architecture decision that should survive across projects and sessions.

**Fields:**
- `content` (required) — The insight, max ~200 chars
- `category` — `pattern | preference | gotcha | decision | tool | workflow`
- `importance` — 1–5 (default 3). Use 5 for system-critical facts.
- `project` — Scope to a project name (omit for global)
- `tags` — Array of strings for filtering

**Dedup behavior:** `normalizeKey(content)` strips punctuation/case. Calling `/learn` with equivalent content increments `confirm_count` rather than inserting a duplicate.

**Code pattern:**
```ts
import { learn } from "~/.claude/memory/db.js";
learn({ content, category, importance, project, tags });
```

**`skipExport` flag:** Pass `skipExport: true` during bulk imports to avoid N+1 `exportMarkdown()` calls. Call `exportMarkdown()` once at the end.

---

## /recall — Search Memories

**When to use:** Before starting work on a topic to surface relevant past decisions.

**Syntax:**
```
/recall [query]
/recall [query] --tags tag1,tag2
/recall [query] --category pattern
/recall [query] --project myapp
/recall [query] --limit 10
```

**FTS5 query syntax:**
- `bun sqlite` — both words anywhere
- `"bun sqlite"` — exact phrase
- `bun* ` — prefix match
- `bun OR sqlite` — either word

**Output:** Shows memory ID, content, importance stars, tags, and graph neighbors (related memory IDs + relationship type).

---

## /forget — Delete a Memory

**When to use:** When a memory is wrong, stale, or superseded.

**Steps:**
1. Run `/recall <topic>` first to find the memory ID
2. Run `/forget <id> [reason]`
3. Confirm with user before deletion (irreversible)
4. CASCADE removes all `memory_tags` and `memory_relations` rows

**Code pattern:**
```ts
import { forget } from "~/.claude/memory/db.js";
forget({ id, reason });
```

---

## /relate — Link Two Memories

**When to use:** When you recognize a conceptual connection between two existing memories.

**Syntax:** `/relate <src_id> <tgt_id> <type>`

**Relationship types:**
| Type | Meaning |
|------|---------|
| `supports` | src provides evidence for tgt |
| `contradicts` | src conflicts with tgt |
| `refines` | src is a more precise version of tgt |
| `depends_on` | src requires tgt to be valid |
| `related_to` | general association |
| `supersedes` | src replaces tgt (tgt is obsolete) |

**Note:** Relations are directional. `A supersedes B` ≠ `B supersedes A`.
