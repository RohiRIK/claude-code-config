# Coding Style

## Universal Rules (Always Apply)

**Immutability:** Create new objects rather than mutating. Use spread (`{...obj, key: val}`).

**Input Validation:** Validate at system boundaries using Zod (TS), Pydantic (Python), or typed params (PS).

**Library Docs (context7):** Always prepend `use context7` before writing code against any external library. Never assume API shapes from training data — library APIs change. context7 output is authoritative.

**File Size:** 200-400 lines typical, 800 max. Functions < 50 lines. Organize by feature/domain.

## Language Standards

Before writing code, load the relevant CodingStandards file via the Skill tool:

| Language | Skill argument |
|----------|---------------|
| TypeScript / JavaScript | `CodingStandards` → TypeScript.md |
| Python | `CodingStandards` → Python.md |
| Bash | `CodingStandards` → Bash.md |
| PowerShell | `CodingStandards` → PowerShell.md |
| Swift / macOS / SwiftUI / AppKit | `CodingStandards` → Swift.md |
| Rust / Cargo / Tokio / Axum | `CodingStandards` → Rust.md |

## Prompt Caching

When calling the Anthropic API directly from hooks or skills, put stable content (system prompt, tool definitions, reference docs) at the top and volatile content (user input, session state) at the bottom. Anthropic caches from the beginning of the prompt — any volatile content inserted early invalidates the entire cache prefix below it, negating up to 90% cost savings. In-session context injection via SessionStart stdout is cached automatically.
