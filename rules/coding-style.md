# Coding Style

## Universal Rules (Always Apply)

**Immutability (CRITICAL):** Create new objects, never mutate. Use spread (`{...obj, key: val}`).

**Error Handling:** Wrap async operations in try/catch with actionable error messages.

**Input Validation:** Validate at system boundaries using Zod (TS), Pydantic (Python), or typed params (PS).

**Library Docs (context7):** Always prepend `use context7` before writing code against any external library. Never assume API shapes from training data — library APIs change. context7 output is authoritative.

**File Size:** 200-400 lines typical, 800 max. Organize by feature/domain.

## Language Standards

Before writing code, load the relevant CodingStandards file via the Skill tool:

| Language | Skill argument |
|----------|---------------|
| TypeScript / JavaScript | `CodingStandards` → TypeScript.md |
| Python | `CodingStandards` → Python.md |
| Bash | `CodingStandards` → Bash.md |
| PowerShell | `CodingStandards` → PowerShell.md |

## Memory Integration

Before starting: `/recall [language] patterns` — surface past gotchas and conventions for this stack.
After discovering a non-obvious pattern: `/learn --category pattern` and tag the language.

## Code Quality Checklist

Before marking work complete:
- [ ] Readable, well-named
- [ ] Functions < 50 lines, files < 800 lines
- [ ] No deep nesting (> 4 levels)
- [ ] Proper error handling, no hardcoded values, no mutation
- [ ] No `any` types or unchecked casts
- [ ] `context7` used for any external library APIs
- [ ] Input validated at system boundaries
- [ ] Exported functions have explicit return types
