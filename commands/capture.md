# /capture — Save Context + Learn in One Shot

Persist something important **right now** — writes to both the project context DB and global LTM memory in a single command.

Use this whenever you discover something worth keeping: a decision made, a gotcha hit, a pattern confirmed, or progress worth logging.

## Usage

```
/capture decision "chose JSONL over SQLite for hook logs — simpler, greppable, no schema"
/capture gotcha "Bun.file().toString() returns [object Object] — use readFileSync instead"
/capture progress "✓ wired hookLogger into 5 hooks, committed 706ae12"
/capture pattern "module-level _flag boolean to skip repeated I/O on hot-path hooks"
```

## What It Does

Both operations run in parallel:

| Store | What | Where |
|-------|------|-------|
| **Context DB** | Project-scoped item | `ltm.db` → `context_items` (injected next session) |
| **LTM** | Global memory | `ltm.db` → `memories` (injected in ALL sessions) |

## Type Mapping

| Argument | Context type | LTM category | Permanent? |
|----------|-------------|--------------|------------|
| `decision` | `decision` | `architecture` | ✅ Never trimmed |
| `gotcha` / `warning` | `gotcha` | `gotcha` | ✅ Never trimmed |
| `progress` / `done` | `progress` | `workflow` | ⏳ Trimmed to last 20 |
| `pattern` / `learn` | `decision` | `pattern` | ✅ Never trimmed |
| `goal` | `goal` | `workflow` | ✅ Replaces existing |

## Instructions for Claude

### Step 1 — Parse arguments

Extract `<type>` and `<content>` from the user's invocation.
Map type alias → context type + LTM category using the table above.
If no type is given, default to `progress` / `workflow`.

### Step 2 — Resolve project

```bash
cat ~/.claude/projects/registry.json
```

Match `cwd` to get `<project_name>`. If not registered, say so and stop.

### Step 3 — Write both stores in parallel

**Context DB:**
```bash
bun -e "
  const { addItem } = await import(process.env.HOME + '/.claude/memory/context.js');
  addItem('PROJECT_NAME', 'CONTEXT_TYPE', 'CONTENT');
  console.log('context: ok');
"
```

**LTM memory:**
```bash
bun -e "
  const { learn } = await import(process.env.HOME + '/.claude/memory/db.js');
  learn({ content: 'CONTENT', category: 'LTM_CATEGORY', importance: IMPORTANCE,
          project_scope: 'PROJECT_NAME', source: 'capture' });
  console.log('ltm: ok');
"
```

**Importance rules:**
- `gotcha` → 4
- `decision` / `architecture` → 3
- `pattern` → 3
- `progress` / `workflow` → 2
- `goal` → 3

### Step 4 — Confirm

```
Captured for **<project>**:
  Context → <type>: "<content>"
  LTM     → <category> (importance ★★★): "<content>"
```

## Rules

- Run both writes in parallel — they are independent
- Never ask clarifying questions — write what was provided immediately
- `gotcha` and `decision` entries are permanent — never trimmed
- `goal` replaces the existing goal (one active goal per project)
- If content is vague, write it as-is — the user knows what they mean
