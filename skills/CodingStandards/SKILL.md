---
name: CodingStandards
description: "Language coding standards (TS, Python, Bash, PowerShell, Swift, Rust). USE WHEN writing, reviewing, or scaffolding code."
user-invocable: false
---

# CodingStandards

USE WHEN writing, implementing, reviewing, or scaffolding code in TypeScript, Python, Bash, PowerShell, Swift, or Rust.

## Language Standards

Load the language file first, then implement:

| Language detected | Standards | Starter Template |
|-------------------|-----------|-----------------|
| TypeScript / JS / Bun / Hono | `TypeScript.md` | `StarterTemplates/TypeScript.md` |
| Python / uv / pydantic | `Python.md` | `StarterTemplates/Python.md` |
| PowerShell / Azure / Entra / Graph | `PowerShell.md` | `StarterTemplates/PowerShell.md` |
| Bash / shell / CI | `Bash.md` | `StarterTemplates/Bash.md` |
| Swift / AppKit / SwiftUI / macOS | `Swift.md` | `StarterTemplates/Swift.md` |
| Rust / Cargo / Tokio / Axum | `Rust.md` | `StarterTemplates/Rust.md` |

**Load StarterTemplates when:** user says "new project", "scaffold", "starting a project", or asks which template to use.
**Load M365Admin.md when:** user mentions Graph API, Exchange Online, Entra ID, Teams admin, SharePoint, PnP, or M365 admin tasks.

## Workflow Routing

**When executing a workflow, output this notification:**

```
Running the **WorkflowName** workflow from the **CodingStandards** skill...
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Review** | "review my code", "check this code", "code review" | `Workflows/Review.md` |

## Quick Reference

| Language | Key rule |
|----------|---------|
| TypeScript | Bun runtime · named exports · discriminated unions · `Promise.all` |
| Python | `uv` always — never `pip` · pydantic at boundaries · ruff |
| PowerShell | `[CmdletBinding()]` + `$ErrorActionPreference = 'Stop'` · `-Param:$false` syntax |
| Bash | `set -euo pipefail` · last resort only · 50-line limit |
| Swift | `.app` bundle for GUI · `@MainActor` for UI · `struct` by default |
| Rust | `Result<T,E>` + `?` everywhere · `thiserror` libs · `anyhow` apps · no `.unwrap()` |

**context7:** Always prepend `use context7` before writing code against any external library.
