# Workflow: RunGenericRecipe

> **DEPRECATED**: Use `SpawnAgent.md` workflow instead for non-blocking execution.

## Step 0: Load Context
**CRITICAL:** Before proceeding, read the context file to understand the available recipes.
- Read file: `skills/Goose/Context-Recipes.md`

## Step 1: Select & Execute Recipe

**Recommended (Non-blocking):**
```bash
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts <recipe_name> --params user_input="..."
```

**Legacy (Blocking - Deprecated):**
```bash
bun ~/.claude/skills/Goose/Tools/run-recipe.ts <recipe_name> [optional_args]
```

## Step 2: Verify Output
Check the output logs to ensure the recipe completed successfully.
- Logs location: `skills/Goose/gooshistory/`

For summarized results:
```bash
bun ~/.claude/skills/Goose/Tools/CollectResults.ts --recent
```
