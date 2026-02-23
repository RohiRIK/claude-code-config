# Workflow: SpawnAgent

Spawn Goose agents for parallel, non-blocking execution.

## Step 1: Match Intent to Recipe

First, determine which recipe matches the user's intent:

```bash
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts "<user intent>"
```

**If matched** (confidence >= 0.5): Proceed to Step 2 with the matched recipe.
**If no match**: Ask user if they want to create a new recipe via GoosifyAgent skill.

## Step 2: Spawn Agent

Spawn the agent in non-blocking mode (default):

```bash
# Non-blocking (returns immediately with agent ID)
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts <recipe-name> --params user_input="<context>"

# Blocking mode (waits for completion)
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts <recipe-name> --wait --params user_input="<context>"
```

**Examples:**
```bash
# Code review
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts code-reviewer --params user_input="Review src/"

# Security audit
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts security-reviewer --params user_input="Audit auth/"

# Multiple agents in parallel (background shell)
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts code-reviewer --params user_input="Review src/" &
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts security-reviewer --params user_input="Audit auth/" &
```

## Step 3: Track Progress

Monitor spawned agents:

```bash
# List all agents
bun ~/.claude/skills/Goose/Tools/AgentStatus.ts --list

# Check specific agent
bun ~/.claude/skills/Goose/Tools/AgentStatus.ts --id <agent-id>

# Wait for agent to complete
bun ~/.claude/skills/Goose/Tools/AgentStatus.ts --wait --id <agent-id>
```

## Step 4: Collect Results

After agent completes, retrieve summarized results:

```bash
bun ~/.claude/skills/Goose/Tools/CollectResults.ts --id <agent-id>
```

## Notes

- Agents run with Goose headless mode (`--no-session`, `GOOSE_MODE=auto`)
- Max turns limited to 50 to prevent runaway execution
- Logs stored in `skills/Goose/gooshistory/`
- Summaries stored in `skills/Goose/summaries/`
- PostToolUse hook auto-summarizes completed agents via Haiku
