---
name: CodingStandards
description: "USE WHEN writing new code, functions, scripts, or classes in TypeScript, Python, PowerShell, Bash, or Swift. Loads language-specific style rules before implementation begins."
user-invocable: false
---

# CodingStandards

Full-stack coding standards with detailed context per language. Each language file is a self-contained SOP.

## Auto-Trigger Conditions

Load this skill automatically when:
- User asks to write, create, implement, or add code in any supported language
- Task involves writing a new function, class, script, or module
- Before any implementation phase begins

Then load the specific language file based on detected language:

| Language detected | Load |
|-------------------|------|
| TypeScript / JS / Bun / Hono | `TypeScript.md` |
| Python / uv / pydantic | `Python.md` |
| PowerShell / Azure / Entra / Graph | `PowerShell.md` |
| Bash / shell / CI | `Bash.md` |
| Swift / AppKit / SwiftUI / macOS | `Swift.md` |

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
| **Swift** | macOS apps, SwiftUI, AppKit, system utilities | `Swift.md` |

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
