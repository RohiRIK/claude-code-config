# Coding Style

## Immutability (CRITICAL)
ALWAYS create new objects, NEVER mutate existing ones. Use spread (`{...obj, key: val}`).

## File Organization
- Many small files > few large files
- 200-400 lines typical, 800 max
- High cohesion, low coupling
- Organize by feature/domain, not by type

## Error Handling
ALWAYS wrap async operations in try/catch with meaningful error messages.

## Input Validation
ALWAYS validate user input at system boundaries using zod.

## Code Quality Checklist
Before marking work complete:
- [ ] Readable, well-named
- [ ] Functions < 50 lines, files < 800 lines
- [ ] No deep nesting (> 4 levels)
- [ ] Proper error handling
- [ ] No console.log, no hardcoded values, no mutation
