---
description: "The Goose Agentic Wrapper skill for autonomous development tasks."
triggers:
  - "goose"
  - "review commit"
  - "generate tests"
  - "refactor code"
  - "update docs"
  - "roast code"
---

# Skill: Goose

The Goose skill provides a high-fidelity wrapper around the Goose agent, enabling autonomous recipes for common development workflows.

## Routing Table

| User Intent | Workflow |
| :--- | :--- |
| "Review code", "Commit changes" | `Workflows/ReviewAndCommit.md` |
| "Roast my code", "Criticize code" | `Workflows/RoastCode.md` |
| "Run recipe", "Generate tests", "Refactor" | `Workflows/RunGenericRecipe.md` |

## Resources
- **Knowledge Base**: `Context-Recipes.md`
- **Logic Wrapper**: `Tools/run-recipe.ts`
