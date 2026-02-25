# FrontendDesign

**Skill:** React, Next.js, and modern frontend patterns.

**Description:** Standards, patterns, and workflows for modern frontend development. USE WHEN designing components, optimizing UI, or implementing state management.

---

## Overview

The FrontendDesign skill provides React, Next.js, and frontend development patterns.

## When to Activate

- Designing React components
- Optimizing frontend performance
- Implementing state management
- Handling forms
- Ensuring accessibility
- "make a component"

## Workflows

### 1. GenerateComponent
Scaffolds a new React component following "Composition Over Inheritance" pattern.

- **Input**: Component Name, Variant requirements
- **Output**: TypeScript with Component, Sub-components, Props interfaces

### 2. OptimizePerformance
Analyzes code and suggests memoization or virtualization strategies.

## Integration

- **CodeReview**: Use patterns from Context-FrontendPatterns.md
- **CreateSkill**: Uses FrontendDesign for UI-based tools

## Voice Notification

When executing a workflow:
```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running WORKFLOWNAME from FrontendDesign"}'
```

## Key Topics

### React Patterns
- Component composition
- Custom hooks
- Context for global state
- Render optimization

### Performance
- Memoization strategies
- Virtualization
- Code splitting
- Bundle optimization

### State Management
- useState/useReducer
- Context API
- State machines (XState)

### Forms
- React Hook Form
- Zod validation
- Error handling

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support

## Related

- **Used by:** [e2e-runner agent](../agents/e2e-runner.md)
- **See also:** [TddWorkflow skill](tdd-workflow.md), [Art skill](art.md)

---

*Documentation generated from `skills/FrontendDesign/SKILL.md` - Last updated: 2026-02-25*
