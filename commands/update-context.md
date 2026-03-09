# /update-context — Mid-Session Context Update

Explicitly add a context item to the DB mid-session. Use this for important items that shouldn't wait until session end (when the `UpdateContext` hook fires automatically).

## When to Use

- After a significant decision that must survive a mid-session compaction
- To correct or override what the `UpdateContext` hook will write automatically
- To manually add a gotcha or decision the hook won't capture

**Note:** Progress is auto-captured at session end by the `UpdateContext` hook. This command is for **mid-session explicit updates** only.

## Usage

```
/update-context goal "New goal description"
/update-context progress "✓ did X"
/update-context decision "chose Y because Z"
/update-context gotcha "⚠ watch out for W"
```

## Instructions for Claude

### Step 1 — Resolve project

```bash
cat ~/.claude/projects/registry.json
```

Match `cwd` → get `<name>`. If not registered: say so, suggest `/register-project`, stop.

### Step 2 — Write to DB

```bash
bun -e "
  const { addItem } = await import(\`\${process.env.HOME}/.claude/memory/context.js\`);
  addItem('PROJECT_NAME', 'TYPE', 'CONTENT');
  console.log('done');
"
```

Map argument to type:

| Argument | DB type | Behavior |
|----------|---------|---------|
| `goal` / `goals` | `goal` | Replaces existing goal |
| `progress` / `prog` | `progress` | Appends (dedup by session) |
| `decision` / `decisions` | `decision` | Appends (permanent) |
| `gotcha` / `gotchas` / `warning` | `gotcha` | Appends (permanent) |

### Step 3 — Confirm

```
Updated context for **<name>**:
  TYPE → "<content added>"
  (exportContextMarkdown called — context-summary.md regenerated)
```

## Rules

- Never write directly to `context-*.md` files — always use `addItem()` via the DB
- `decision` and `gotcha` entries are permanent — they are never auto-trimmed
- `progress` entries are trimmed to last 20 by the `Cleanup` hook at session end
- `goal` replaces the existing goal (only one goal row per project)
- Do NOT ask the user questions — write what was provided immediately
