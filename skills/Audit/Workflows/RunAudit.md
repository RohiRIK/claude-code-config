# RunAudit Workflow

Triggers the Goose claude-auditor agent to scan Claude Code configuration and environment.

## Step 1: Spawn Goose Auditor Agent

Use the Goose skill to spawn the claude-auditor agent:

```bash
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts claude-auditor \
  --params user_input="Run full productivity audit"
```

This will:
1. Launch external Goose agent
2. Scan ~/.claude.json and ~/.claude/ directory
3. Generate 0-100 score
4. Update ~/.claude_productivity_history.json
5. Return audit report with recommendations

## Step 3: Display Results

The agent will return a structured report with:
- Overall score (0-100)
- Critical issues (ignore patterns)
- High priority (model costs)
- Medium priority (log bloat)
- Best practices
- Actionable recommendations with exact commands

## Step 4: Track History

The agent automatically updates `~/.claude_productivity_history.json` with:
- Timestamp
- Score breakdown
- Issues found
- Recommendations given

You can view history with:
```bash
cat ~/.claude_productivity_history.json | jq '.audits | sort_by(.timestamp) | reverse | .[0:5]'
```
