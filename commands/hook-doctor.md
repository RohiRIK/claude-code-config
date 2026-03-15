# /hook-doctor — Hook Health Diagnostic

Run a health check on all registered Claude Code hooks.

## What It Checks

- All hook files registered in `settings.json` exist on disk
- Error and warning counts per hook in the last 24 hours (from `~/.claude/logs/hooks.log`)
- Hooks with ≥ 3 errors in 24h are flagged 🔴 as unhealthy

## Instructions for Claude

Run the diagnostic and display the output directly:

```bash
bun /Users/rohirikman/.claude/hooks/lib/hookDoctor.ts
```

Display the full output verbatim. If any hooks are flagged 🔴 or ❌:
- Explain what the error means
- Suggest a fix or next step

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | File exists |
| ❌ | File missing — hook will fail silently |
| 🟢 | No errors in last 24h |
| 🟡 | 1–2 errors in last 24h — monitor |
| 🔴 | 3+ errors in 24h — needs attention |

## Related

- Log file: `~/.claude/logs/hooks.log`
- View raw log: `tail -100 ~/.claude/logs/hooks.log`
- Hook source: `~/.claude/hooks/`
