# CodingStandards

**Skill:** Language-specific coding standards for TypeScript, Python, Bash, PowerShell, Swift, and Rust.

**Description:** USE WHEN writing, implementing, reviewing, or scaffolding code in TypeScript, Python, Bash, PowerShell, Swift, or Rust. Loads language-specific style rules and starter templates before implementation begins.

---

## Overview

The CodingStandards skill is a self-contained SOP per language. Each language file covers naming, types, error handling, async patterns, linting, testing, and anti-patterns. The StarterTemplates folder provides curated GitHub repo references for scaffolding new projects.

## Auto-Trigger Conditions

- Writing, implementing, or scaffolding code in any supported language
- "new project", "scaffold", "starting a project" → also load `StarterTemplates/<lang>.md`
- "Graph API", "Exchange Online", "Entra ID", "Teams admin", "SharePoint", "PnP" → also load `M365Admin.md`

## Language Standards Files

| Language | File | Key rules |
|----------|------|-----------|
| TypeScript / Bun / Hono | `TypeScript.md` | Bun runtime, discriminated unions, named exports, `Promise.all` |
| Python / uv | `Python.md` | `uv` always, pydantic at boundaries, ruff |
| PowerShell / Azure | `PowerShell.md` | `[CmdletBinding()]`, `$ErrorActionPreference='Stop'`, `-Param:$false` |
| Bash | `Bash.md` | `set -euo pipefail`, 50-line limit, switch to TS for complex logic |
| Swift / macOS | `Swift.md` | `.app` bundle for GUI, `@MainActor` for UI, `struct` by default |
| Rust | `Rust.md` | `Result<T,E>` + `?`, `thiserror`/`anyhow`, no `.unwrap()`, `SAFETY:` comments |

## StarterTemplates

Curated GitHub repos (3–7 per language) for scaffolding new projects:

| Language | File | Highlights |
|----------|------|-----------|
| TypeScript | `StarterTemplates/TypeScript.md` | Bun CLI, Hono API, full-stack monorepo, library |
| Python | `StarterTemplates/Python.md` | uv CLI, FastAPI, FastAPI workspace, library |
| Swift | `StarterTemplates/Swift.md` | SwiftUI macOS app, menu bar, resources |
| Rust | `StarterTemplates/Rust.md` | CLI, Axum API, library crate, WASM, embedded |
| PowerShell | `StarterTemplates/PowerShell.md` | Plaster module, runbook, Entra automation |
| Bash | `StarterTemplates/Bash.md` | nicowillis, ralish, inline scaffold |

## M365Admin Reference

`M365Admin.md` — Full Microsoft 365 admin PowerShell reference:

- **Microsoft.Graph SDK** — `Connect-MgGraph`, pagination, throttling, least-privilege scopes
- **Graph REST API** — OData filters (`$filter`, `$select`, `$expand`), v1.0 vs beta
- **Exchange Online v3** — `Get-EXO*` preferred, `-ResultSize Unlimited`, app-only cert auth
- **Microsoft Teams PS** — `Connect-MicrosoftTeams`, policy cmdlets
- **PnP PowerShell** — `Connect-PnPOnline`, ⚠️ Sept 2024 breaking change: custom Entra app registration mandatory

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "review my code", "code review" | `Workflows/Review.md` |

## Related

- **Used by:** `rules/coding-style.md` (loads before every coding task), `agents/code-simplifier.md`
- **See also:** [security-review skill](security-review.md), [backend-design skill](backend-design.md), [frontend-design skill](frontend-design.md)

---

*Documentation updated: 2026-03-25*
