---
name: Audit
description: Claude Code productivity audit. USE WHEN audit claude, check claude config, productivity check, optimize claude.
---

# Audit

Runs a productivity audit of the Claude Code environment using the Goose claude-auditor agent.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **RunAudit** | "audit", "check config", "productivity audit" | `Workflows/RunAudit.md` |

## Examples

**Example 1: Full audit**
```
User: "/audit"
→ Invokes RunAudit workflow
→ Spawns Goose claude-auditor agent
→ Returns score and recommendations
```

**Example 2: Quick check**
```
User: "audit my claude setup"
→ Runs full productivity scan
→ Displays 0-100 score with priority issues
→ Updates ~/.claude_productivity_history.json
```
