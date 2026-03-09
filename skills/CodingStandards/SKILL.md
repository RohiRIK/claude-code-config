---
name: CodingStandards
description: Language-specific coding standards for the full stack. USE WHEN writing, reviewing, or debugging TypeScript, Python, PowerShell, or Bash code. Loads detailed standards per language on demand.
---

# CodingStandards

Full-stack coding standards with detailed context per language. Each language file is a self-contained SOP.

## Workflow Routing

**When executing a workflow, output this notification:**

```
Running the **WorkflowName** workflow from the **CodingStandards** skill...
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Review** | "review my code", "check this code", "code review" | `Workflows/Review.md` |

## Language Standards (Load On Demand)

| Language | When to Load | File |
|----------|-------------|------|
| **TypeScript** | Writing TS/JS, Bun, Hono, Drizzle, Cloudflare Workers | `TypeScript.md` |
| **Python** | Writing Python, using uv, pydantic, data science | `Python.md` |
| **PowerShell** | Azure automation, Entra ID, Graph API | `PowerShell.md` |
| **Bash** | Shell scripts, glue scripts, CI steps | `Bash.md` |

## Quick Reference

- **Primary language:** TypeScript (Bun runtime)
- **Python packages:** `uv` always — never `pip`
- **PowerShell:** `[CmdletBinding()]` + `$ErrorActionPreference = 'Stop'` on every script
- **Bash:** `set -euo pipefail` always — last resort only (~50 line limit)
- **context7:** Always use `use context7` before looking up any external library API

## Examples

**Example 1: TypeScript task**
```
User: "Write a Hono route that validates with Zod"
→ Load TypeScript.md for TS patterns
→ use context7 for Hono/Zod APIs
→ Apply named exports, explicit return types, async/await rules
```

**Example 2: Python task**
```
User: "Write a script to process CSV files"
→ Load Python.md for Python patterns
→ Use pathlib.Path, type hints, uv run
→ Never pip install
```

**Example 3: PowerShell task**
```
User: "Write a script to disable inactive Entra ID users"
→ Load PowerShell.md for PS patterns
→ Apply [CmdletBinding()], $ErrorActionPreference = 'Stop'
→ Return objects not strings, no Write-Host
```
