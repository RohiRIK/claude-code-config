# Workflow: MatchRecipe

Match user intent to available Goose recipes.

## Step 1: Run Intent Matching

```bash
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts "<user intent>"
```

**Examples:**
```bash
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts "review my code for security issues"
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts "generate tests for my functions"
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts "roast my code"
```

## Step 2: Interpret Results

The tool returns JSON with:

```json
{
  "matched": true,
  "recipe": "security-reviewer",
  "file": "Recipes/security-reviewer.yaml",
  "confidence": 0.85,
  "alternatives": [
    { "name": "code-reviewer", "confidence": 0.6 }
  ],
  "reason": "Exact trigger match: \"security review\"",
  "category": "security"
}
```

| Field | Meaning |
|-------|---------|
| matched | true if confidence >= 0.5 |
| recipe | Best matching recipe name |
| confidence | 0.0 - 1.0 match strength |
| alternatives | Other potential matches |
| reason | Why this recipe was matched |

## Step 3: Handle Results

**If matched (confidence >= 0.5):**
- Proceed with `SpawnAgent.md` workflow using the matched recipe

**If low confidence (0.3 - 0.5):**
- Show alternatives to user
- Ask for confirmation before proceeding

**If no match (confidence < 0.3):**
- Show available recipes: `bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts --list`
- Ask user to select or create a new recipe

## Available Recipes

List all recipes:
```bash
bun ~/.claude/skills/Goose/Tools/MatchRecipe.ts --list
```

Categories:
- **review**: code-reviewer
- **security**: security-reviewer
- **architecture**: architect
- **planning**: planner
- **testing**: tdd-guide, e2e-runner, test_generator
- **refactoring**: refactor-cleaner, refactor_pro
- **documentation**: doc-updater, doc_sync
- **debugging**: build-error-resolver
- **git**: commit_reviewer
- **entertainment**: comedian
