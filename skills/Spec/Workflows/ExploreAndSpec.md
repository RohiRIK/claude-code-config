# ExploreAndSpec

Ground the spec in existing code and prior decisions before writing a single requirement.

## Thinking Pass (interleaved)

Start an extended thinking pass. During thinking, interleave tool calls rather than gathering sequentially:

- Call `mcp__plugin_ltm_ltm__ltm_recall` with the feature topic — surfaces prior architecture decisions, gotchas, and patterns while reasoning is still forming
- Call `mcp__plugin_context-mode_context-mode__ctx_batch_execute` for codebase exploration — find existing files, types, and patterns that the new code must conform to

Do not gather all data first then reason. Let each tool result shape the next question. The goal is a single coherent thinking pass that produces grounded constraints, not a sequential gather-then-reason pipeline.

Record from thinking:
- Prior architecture decisions and known gotchas (from LTM recall)
- Existing files and modules the feature must integrate with
- Types and interfaces that constrain implementation
- Patterns used nearby (naming, error handling, data flow)

## Write the Spec

Write the spec to `specs/<feature-slug>.md`. Include:

### What
One paragraph — what is being built and why.

### Existing context
- Relevant files found during exploration
- Prior decisions or constraints from LTM

### Acceptance criteria
Numbered list. Each criterion must be testable — it becomes a task in `/plan` and a test case in `/build`.

```
1. Given X, when Y, then Z
2. Edge case: when A is empty, return B
3. Existing behaviour C is unchanged
```

### Out of scope
Anything explicitly NOT being built in this iteration.

## Hand off

- Feature work → run `/plan` against the spec
- Bug fix → run `/test` (ProveIt) using the acceptance criteria as the failing test target
