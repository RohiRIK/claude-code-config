# /update-context — Auto-Update Context Files from Session

Automatically extracts what happened in this session and writes it to the project context files. No questions asked.

## Usage

```
/update-context              # auto-extract from session and write all 4 files
/update-context goal "..."   # override goal only
/update-context progress "✓ did X"   # append one progress item manually
/update-context decision "chose Y because Z"
/update-context gotcha "⚠ watch out for W"
```

## Instructions for Claude

### Step 1 — Resolve project

Read `~/.claude/projects/registry.json`, match `cwd` → get `<name>`.
`projectDir` = `~/.claude/projects/<name>/`

If not registered: say so, suggest `/register-project`, then stop.

### Step 2 — If called with no arguments: AUTO mode

Look back at the current conversation and extract:

**Progress** (what was completed this session):
- Scan for completed tasks, fixes, features, commands run
- Write each as: `✓ [YYYY-MM-DD] <what was done, 1 line, max 100 chars>`
- Today's date = use current date
- Append all new items to `context-progress.md`
- Skip items already present in the file

**Decisions** (architectural or significant choices made):
- Scan for decisions like "we chose X over Y", "we decided to...", "going with..."
- Write each as: `- <decision and reason, 1 line>`
- Append new items to `context-decisions.md`
- Skip duplicates

**Gotchas** (warnings, blockers, things to watch):
- Scan for "watch out", "gotcha", "bug", "issue", "broken", edge cases discovered
- Write each as: `⚠ <warning, 1 line>`
- Append new items to `context-gotchas.md`

**Goal** (only update if goal clearly changed this session):
- If the goal shifted, REPLACE `context-goals.md` with new goal (max 3 bullet points)
- If goal is unchanged, leave the file as-is

### Step 3 — If called with arguments: MANUAL mode

Map argument to file and write exactly what was provided — no extraction needed:

| Argument | File | Mode |
|----------|------|------|
| `goal` / `goals` | `context-goals.md` | replace |
| `progress` / `prog` | `context-progress.md` | append |
| `decision` / `decisions` | `context-decisions.md` | append |
| `gotcha` / `gotchas` / `warning` | `context-gotchas.md` | append |

### Step 4 — Confirm

Print a summary of what was written:

```
Updated context for **<name>**:
  context-progress.md  → +N items
  context-decisions.md → +N items
  context-gotchas.md   → +N items
  context-goals.md     → unchanged / replaced
```

## Rules

- Never delete existing entries in progress/decisions/gotchas — append only
- goals.md is the ONLY file that gets replaced
- Keep each line under 100 chars
- Do NOT ask the user questions — extract and write autonomously
- If nothing new to write, say "Nothing new to add — context is up to date"
