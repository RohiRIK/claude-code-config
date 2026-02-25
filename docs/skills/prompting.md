# Prompting

**Skill:** Meta-prompting system for dynamic prompt generation.

**Description:** Meta-prompting system for dynamic prompt generation using templates, standards, and patterns. USE WHEN meta-prompting, template generation, or prompt optimization.

---

## Overview

The Prompting skill is the "standard library" for prompt engineering - owns all prompt engineering concerns.

## Core Components

### 1. Standards.md
Complete prompt engineering documentation:
- Anthropic's Claude 4.x Best Practices
- Context engineering principles
- Multi-context window workflows
- Agentic coding best practices

### 2. Templates/
Handlebars-based system for programmatic prompt generation.

**The Five Primitives:**

| Primitive | Purpose | Use Case |
|-----------|---------|----------|
| ROSTER | Data-driven definitions | 32 agents, 83 skills |
| VOICE | Personality calibration | Voice parameters |
| STRUCTURE | Workflow patterns | Phased analysis |
| BRIEFING | Agent context handoff | Delegation |
| GATE | Validation checklists | Quality gates |

### 3. Tools/

**RenderTemplate.ts**
```bash
bun run ~/.claude/skills/Prompting/Tools/RenderTemplate.ts \
  --template Primitives/Briefing.hbs \
  --data path/to/data.yaml \
  --output path/to/output.md
```

**ValidateTemplate.ts**
```bash
bun run ~/.claude/skills/Prompting/Tools/ValidateTemplate.ts \
  --template Primitives/Briefing.hbs \
  --data path/to/sample-data.yaml
```

## Template Syntax

| Syntax | Purpose | Example |
|--------|---------|---------|
| `{{variable}}` | Interpolation | `Hello {{name}}` |
| `{{object.property}}` | Nested access | `{{agent.voice_id}}` |
| `{{#each items}}...{{/each}}` | Iteration | List generation |
| `{{#if condition}}...{{/if}}` | Conditional | Optional sections |
| `{{> partial}}` | Partial include | Reusable components |

## Usage Examples

### Generate Agent Briefing
```typescript
const prompt = renderTemplate('Primitives/Briefing.hbs', {
  briefing: { type: 'research' },
  agent: { id: 'EN-1', name: 'Skeptical Thinker' },
  task: { description: 'Analyze security architecture' }
});
```

## Token Efficiency

The system achieved ~65% token reduction:

| Area | Before | After | Savings |
|------|--------|-------|---------|
| SKILL.md Frontmatter | 20,750 | 8,300 | 60% |
| Agent Briefings | 6,400 | 1,900 | 70% |
| Voice Notifications | 6,225 | 725 | 88% |

## Related

- **Used by:** All agents and skills for prompt generation
- **See also:** [Art skill](art.md), [ContentWriter skill](content-writer.md)

---

*Documentation generated from `skills/Prompting/SKILL.md` - Last updated: 2026-02-25*
