---
name: FrontendDesign
description: Standards, patterns, and workflows for modern frontend development (React, Next.js, Performance). USE WHEN designing components, optimizing UI, or implementing state management.
---

# FrontendDesign

**Invoke when:** designing React components, optimizing frontend performance, implementing state management, handling forms, or ensuring accessibility.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/FrontendDesign/`

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the FrontendDesign skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **FrontendDesign** skill...
   ```

**Full documentation:** `~/.claude/skills/CORE/SkillNotifications.md`

## Available Workflows

### 1. GenerateComponent
Scaffolds a new React component following the "Composition Over Inheritance" pattern.
- **Input**: Component Name, Variant requirements.
- **Output**: TypeScript file with Component, Sub-components (Header/Body), and Props interfaces.

### 2. OptimizePerformance
Analyzes a code snippet and suggests memoization or virtualization strategies based on `Context-FrontendPatterns.md`.

## Integration with Other Skills
- **CodeReview**: Refer to `Context-FrontendPatterns.md` during reviews to enforce standards.
- **CreateSkill**: Uses FrontendDesign patterns if building UI-based internal tools.