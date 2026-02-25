# planner

**Agent:** Planning specialist for complex features and refactoring.

**Model:** opus

**Description:** Expert planning specialist for complex features and refactoring. Use PROACTIVELY when users request feature implementation, architectural changes, or complex refactoring.

---

## Overview

The planner agent creates comprehensive implementation plans before any code is written. It analyzes requirements, breaks down tasks, identifies risks, and waits for explicit confirmation before proceeding.

## When to Invoke

| Trigger | Context |
|---------|---------|
| `/plan` | Start any non-trivial feature |
| "I need to add..." | New feature request |
| "We should implement..." | Implementation planning |
| "How do I build..." | Building from scratch |
| Complex refactoring | Significant code changes |

## What It Does

### 1. Requirements Analysis
- Restates the feature request clearly
- Identifies success criteria
- Lists assumptions and constraints

### 2. Architecture Review
- Analyzes existing codebase structure
- Identifies affected components
- Considers reusable patterns

### 3. Step Breakdown
Creates phases with:
- Clear, specific actions
- File paths and locations
- Dependencies between steps
- Estimated complexity (High/Medium/Low)
- Potential risks

### 4. Plan Presentation
Presents the plan and **WAITS** for confirmation before any code is written.

## Plan Format

```markdown
# Implementation Plan: [Feature Name]

## Overview
[2-3 sentence summary]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Implementation Phases

### Phase 1: [Phase Name]
1. **[Step Name]** (File: path/to/file.ts)
   - Action: Specific action
   - Dependencies: None / Requires step X
   - Risk: Low/Medium/High

## Testing Strategy
- Unit tests: [files]
- Integration tests: [flows]

## Risks & Mitigations
- **Risk**: [Description]
  - Mitigation: [How to address]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## Key Principles

1. **Be Specific**: Use exact file paths, function names
2. **Consider Edge Cases**: Null values, empty states, error scenarios
3. **Minimize Changes**: Prefer extending over rewriting
4. **Enable Testing**: Structure for easy verification
5. **Think Incrementally**: Each step should be verifiable

## Red Flags Checked

- Large functions (>50 lines)
- Deep nesting (>4 levels)
- Duplicated code
- Missing error handling
- Hardcoded values
- Missing tests
- Performance bottlenecks

## Related

- **Uses:** Code context from project
- **Invokes:** May spawn other agents after confirmation
- **See also:** [architect](architect.md), [tdd-guide](../skills/tdd-workflow.md)

---

*Documentation generated from `agents/planner.md` - Last updated: 2026-02-25*
