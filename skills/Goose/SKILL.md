---
name: Goose
description: Parallel agent orchestration using Goose recipes. USE WHEN user wants to spawn agents, run recipes, review code, generate tests, refactor, roast code, security audit, or any autonomous development task. Supports non-blocking parallel execution.
---

# Goose

Parallel agent orchestration system using Goose recipes for autonomous development tasks.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Goose/`

If this directory exists, load and apply any PREFERENCES.md, configurations, or resources found there.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the Goose skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **Goose** skill...
   ```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **SpawnAgent** | "spawn agent", "run recipe", "execute agent" | `Workflows/SpawnAgent.md` |
| **CollectResults** | "get results", "collect results", "agent output" | `Workflows/CollectResults.md` |
| **MatchRecipe** | "find recipe", "which recipe", "match intent" | `Workflows/MatchRecipe.md` |
| **RunGenericRecipe** | "run specific recipe" (legacy) | `Workflows/RunGenericRecipe.md` |

## Examples

**Example 1: Spawn parallel code review agents**
```
User: "Review my code for quality and security issues"
-> Invokes SpawnAgent workflow
-> Matches intent to code-reviewer and security-reviewer
-> Spawns both agents in parallel (non-blocking)
-> Returns agent IDs for tracking
```

**Example 2: Check agent status and collect results**
```
User: "Get results from the code review"
-> Invokes CollectResults workflow
-> Checks agent status
-> Returns Haiku-summarized findings with key issues and recommendations
```

**Example 3: Find best recipe for a task**
```
User: "What recipe should I use to fix build errors?"
-> Invokes MatchRecipe workflow
-> Returns: build-error-resolver with 0.95 confidence
```

## Quick Reference

**Spawn agents:**
```bash
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts code-reviewer --params user_input="Review src/"
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts security-reviewer --params user_input="Audit auth/"
```

**Check status:**
```bash
bun ~/.claude/skills/Goose/Tools/AgentStatus.ts --list
bun ~/.claude/skills/Goose/Tools/AgentStatus.ts --id <agent-id>
```

**Get results:**
```bash
bun ~/.claude/skills/Goose/Tools/CollectResults.ts --id <agent-id>
bun ~/.claude/skills/Goose/Tools/CollectResults.ts --recent 5
```

**Match recipe:**
```bash
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts "review code for security"
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts --list
```

## Resources

- **Recipe Catalog:** `recipe-catalog.json` (14 recipes)
- **Agent Registry:** `agent-registry.json`
- **Summaries:** `summaries/`
- **Logs:** `gooshistory/`
