# Workflow: ReviewAndCommit

## Step 0: Load Context
**CRITICAL:** Before proceeding, read the context file to understand the available recipes.
- Read file: `skills/Goose/Context-Recipes.md`

## Step 1: Prepare Environment
1. Ensure you have staged the files you want to commit (`git add ...`).
2. Verify `goose` is installed and authenticated.

## Step 2: Execute Recipe
Run the Goose wrapper tool to trigger the review and commit process.

```bash
bun skills/Goose/Tools/run-recipe.ts commit_reviewer
```

## Step 3: Verification
Check the output above.
- If **Goose** reports "Commit Successful", verify with `git log -1`.
- If **Goose** reports issues, fix them and re-stage.
