# Goose

**Skill:** Parallel agent orchestration using Goose recipes.

**Description:** Parallel agent orchestration using Goose recipes. USE WHEN user wants to spawn agents, run recipes, review code, generate tests, refactor, or any autonomous development task.

---

## Overview

The Goose skill enables parallel agent execution for autonomous development tasks.

## Workflow Routing

| Trigger | Workflow | File |
|---------|----------|------|
| "spawn agent" | SpawnAgent | Workflows/SpawnAgent.md |
| "run recipe" | SpawnAgent | Workflows/SpawnAgent.md |
| "get results" | CollectResults | Workflows/CollectResults.md |
| "find recipe" | MatchRecipe | Workflows/MatchRecipe.md |

## Usage

### Spawn Agents
```bash
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts code-reviewer --params user_input="Review src/"
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts security-reviewer --params user_input="Audit auth/"
```

### Check Status
```bash
bun ~/.claude/skills/Goose/Tools/AgentStatus.ts --list
bun ~/.claude/skills/Goose/Tools/AgentStatus.ts --id <agent-id>
```

### Collect Results
```bash
bun ~/.claude/skills/Goose/Tools/CollectResults.ts --id <agent-id>
bun ~/.claude/skills/Goose/Tools/CollectResults.ts --recent 5
```

### Match Recipe
```bash
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts "review code for security"
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts --list
```

## Examples

### Parallel Code Review
```
User: "Review my code for quality and security"
→ Invokes SpawnAgent
→ Matches to code-reviewer + security-reviewer
→ Spawns both in parallel
→ Returns agent IDs
```

### Collect Results
```
User: "Get results from the code review"
→ Invokes CollectResults
→ Returns Haiku-summarized findings
```

## Resources

- **Recipe Catalog:** `recipe-catalog.json`
- **Agent Registry:** `agent-registry.json`
- **Summaries:** `summaries/`
- **Logs:** `gooshistory/`

## Related

- **Used by:** All agents (can spawn other agents)
- **See also:** All individual agents

---

*Documentation generated from `skills/Goose/SKILL.md` - Last updated: 2026-02-25*
