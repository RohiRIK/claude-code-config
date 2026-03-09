# Coding Style

## Universal Rules (Always Apply)

**Immutability (CRITICAL):** Create new objects, never mutate. Use spread (`{...obj, key: val}`).

**Error Handling:** Wrap async operations in try/catch with actionable error messages.

**Input Validation:** Validate at system boundaries using Zod (TS), Pydantic (Python), or typed params (PS).

**Library Docs (context7):** Always prepend `use context7` before writing code against any external library. Never assume API shapes from training data — library APIs change. context7 output is authoritative.

**File Size:** 200-400 lines typical, 800 max. Organize by feature/domain.

## Language Standards

For detailed coding patterns, load the **CodingStandards** skill:

- **TypeScript** → `CodingStandards/TypeScript.md`
- **Python** → `CodingStandards/Python.md`
- **PowerShell** → `CodingStandards/PowerShell.md`
- **Bash** → `CodingStandards/Bash.md`

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
