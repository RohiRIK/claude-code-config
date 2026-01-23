# Workflow: RoastCode

## Step 0: Load Context
**CRITICAL:** Before proceeding, read the context file to understand the available recipes.
- Read file: `skills/Goose/Context-Recipes.md`

## Step 1: Select Target
Identify the code file the user wants to "roast" (or have explained with humor).

## Step 2: Execute Recipe
Run the `comedian` recipe against the target file.

```bash
bun skills/Goose/Tools/run-recipe.ts comedian --args input_file="<PATH_TO_FILE>"
```

## Step 3: Enjoy
Output the result to the user.
