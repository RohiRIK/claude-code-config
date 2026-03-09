# /check-context — Verify Session Context

Verify what context is loaded and confirm DB state matches what was injected at session start.

## Instructions for Claude

### Step 1 — Resolve project

```bash
cat ~/.claude/projects/registry.json
```

Match `cwd` via exact → prefix → slug fallback. Get `<name>` and `projectDir = ~/.claude/projects/<name>/`.

If not registered: say so, suggest `/register-project`, then stop.

### Step 2 — Query DB (primary source)

```bash
bun -e "
  const { getItems } = await import(\`\${process.env.HOME}/.claude/memory/context.js\`);
  const goal = getItems('NAME', 'goal');
  const decisions = getItems('NAME', 'decision');
  const progress = getItems('NAME', 'progress', 3);
  const gotchas = getItems('NAME', 'gotcha');
  console.log(JSON.stringify({ goal, decisions, progress, gotchas }));
"
```

If DB unavailable (no `ltm.db`): read `context-summary.md` as fallback and note "DB not available".

### Step 3 — Check LTM memories

```bash
bun -e "
  const { getContextMerge } = await import(\`\${process.env.HOME}/.claude/memory/db.js\`);
  const r = getContextMerge('NAME');
  console.log('globals:', r.globals.length, 'scoped:', r.scoped.length);
"
```

### Step 4 — Output (exact format)

---

## Context Check — **<name>**

**Path:** `<cwd>`
**Registry match:** <exact | prefix from `<path>` | slug fallback | not registered>
**DB:** <available at `~/.claude/memory/ltm.db` | not available — using .md fallback>

### Context Items (from DB):
- **Goal:** <goal content, or `none`>
- **Last 3 progress items:**
  - <item>
  - <item>
  - <item>
- **Decisions on file:** <count>
- **Gotchas on file:** <count>

### LTM Memories:
- **Global (importance=5):** <count>
- **Project-scoped:** <count>

### Session injection:
<one of:>
- Context was injected at session start — matches DB ✅
- Context was injected but DB has newer items ⚠️
- No injection — fresh session or context-summary.md missing

### Status:
<one of:>
- **Complete** — DB active, context injected, ready to work.
- **DB missing** — using .md fallback. Run `bun ~/.claude/memory/migrate.ts` to initialize.
- **No context** — project registered but no goal set. Run `/init-context`.
- **Not registered** — run `/register-project` first.

---

## Rules

- Query DB directly — do not rely on session memory alone
- If DB and injected context differ, flag it clearly
- Never fabricate content not found in DB or files
