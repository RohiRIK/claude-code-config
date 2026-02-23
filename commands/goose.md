---
description: Spawn Goose agents for parallel autonomous development tasks
allowed-tools: Bash, Read, Write, Skill
---

# Goose Agent Orchestration

Invoke the Goose skill to handle: $ARGUMENTS

## Routing

Based on the user's request, determine the appropriate action:

### Intent Matching
If the user wants to know which recipe to use:
```bash
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts "$ARGUMENTS"
```

### Spawn Agents
If the user wants to run a specific task (review, security audit, refactor, etc.):
1. Match intent to recipe first
2. Spawn the agent:
```bash
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts <recipe-name> --params user_input="$ARGUMENTS"
```

### Check Status
If the user asks about agent status:
```bash
bun ~/.claude/skills/Goose/Tools/AgentStatus.ts --list
```

### Collect Results
If the user wants results from completed agents:
```bash
bun ~/.claude/skills/Goose/Tools/CollectResults.ts --recent 5
```

## Available Recipes

- **code-reviewer** - Expert code review for quality and maintainability
- **security-reviewer** - Security vulnerability assessment
- **architect** - System architecture analysis
- **planner** - Implementation planning
- **tdd-guide** - Test-driven development guidance
- **refactor-cleaner** - Code refactoring and cleanup
- **doc-updater** - Documentation updates
- **build-error-resolver** - Build error diagnosis and fixes

For full skill documentation: `~/.claude/skills/Goose/SKILL.md`
