# Workflow: RunGenericRecipe

## Step 0: Load Context
**CRITICAL:** Before proceeding, read the context file to understand the available recipes.
- Read file: `skills/Goose/Context-Recipes.md`

## Step 1: Select & Execute Recipe
Decide which recipe matches the user's intent, then run it.

**Usage:**
```bash
# Syntax: bun skills/Goose/Tools/run-recipe.ts <recipe_name> [optional_args]

# Examples:
# bun skills/Goose/Tools/run-recipe.ts test_generator
# bun skills/Goose/Tools/run-recipe.ts refactor_pro
# bun skills/Goose/Tools/run-recipe.ts doc_sync
```

## Step 2: Verify Output
Check the output logs to ensure the recipe completed successfully.
- Logs location: `~/.gemini/goose-logs/`
