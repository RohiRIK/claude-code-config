# /update-context — Manually Update Context Files

Update one or more of the 4 project context files for the current project.

## Usage

```
/update-context                        # interactive — pick file + enter content
/update-context goal "new goal here"   # update context-goals.md directly
/update-context progress "✓ did X"    # append to context-progress.md
/update-context decision "chose Y because Z"  # append to context-decisions.md
/update-context gotcha "⚠ watch out for W"   # append to context-gotchas.md
```

## Instructions for Claude

### Step 1 — Resolve project

Read `~/.claude/projects/registry.json`, match `cwd` to get `<name>`.
`projectDir` = `~/.claude/projects/<name>/`

If project not registered: say so and suggest `/register-project` first.

### Step 2 — Determine which file and content

**If arguments provided:** map the first argument to a file:
| Argument | File |
|----------|------|
| `goal` / `goals` | `context-goals.md` |
| `progress` / `prog` | `context-progress.md` |
| `decision` / `decisions` | `context-decisions.md` |
| `gotcha` / `gotchas` / `warning` | `context-gotchas.md` |

**If no arguments:** ask:
> Which context file do you want to update?
> 1. Goals (`context-goals.md`) — current objective
> 2. Progress (`context-progress.md`) — append a completed item
> 3. Decisions (`context-decisions.md`) — append a decision
> 4. Gotchas (`context-gotchas.md`) — append a warning
>
> Enter 1–4:

Then ask for the content if not provided.

### Step 3 — Write the file

**context-goals.md:** REPLACE entire file (goals change, not accumulate).
Max 5 lines. Format: plain bullet points.

**context-progress.md:** APPEND a new line.
Format: `✓ [YYYY-MM-DD] <what was done>`
Auto-prefix today's date if not included.

**context-decisions.md:** APPEND a new line.
Format: `- <decision made and why>`

**context-gotchas.md:** APPEND a new line.
Format: `⚠ <warning or blocker>`

### Step 4 — Confirm

Show what was written:
> Updated `context-<file>.md` for **<name>**:
> ```
> <the line(s) written>
> ```

## Rules

- Never delete existing entries in progress/decisions/gotchas — append only
- goals.md is the only file that gets replaced
- Keep each line under 100 chars
- If the user writes a multi-line goal, condense to 1–3 bullet points
