# Context: Goose Recipes

This file defines the available recipes (behaviors) for the Goose agent. These recipes are triggered via the `run-recipe.ts` tool.

## Available Recipes

### 1. Commit Reviewer (`commit_reviewer`)
*   **Goal:** Secure and standardize git commits.
*   **Process:** Reviews staged changes (`git diff --cached`), audits for secrets/logic errors, and generates a Conventional Commit message.

### 2. Test Generator (`test_generator`)
*   **Goal:** Automate unit test creation.
*   **Process:** Analyzes source code, identifies edge cases, and writes `bun:test` suites to ensure stability.

### 3. Refactor Pro (`refactor_pro`)
*   **Goal:** Modernize code and reduce technical debt.
*   **Process:** Identifies long functions and magic values, applies clean code patterns, and verifies functionality remains intact.

### 4. Doc Sync (`doc_sync`)
*   **Goal:** Keep documentation in parity with source code.
*   **Process:** Scans code changes and automatically updates `README.md` or internal docs to reflect new features or API changes.

### 5. The Roastmaster (`comedian`)
*   **Goal:** Entertainment-driven code quality review.
*   **Process:** Provides a "Gordon Ramsay style" roast of your code smells, followed by a valid technical explanation of how to fix them.

## Execution
Run any recipe using the wrapper:
`bun skills/Goose/Tools/run-recipe.ts <recipe_name>`
