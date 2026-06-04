---
type: documentation
category: methodology
description: Handlebars-based programmatic templating engine — five primitives (ROSTER, VOICE, STRUCTURE, BRIEFING, GATE) for generating prompts from data. Tooling reference.
---

# Prompt Templating System

Programmatic prompt generation: structure is fixed in a template, content is parameterized from data. Prompts that write prompts.

## Core Syntax

Handlebars notation (Anthropic's official Claude Console variable syntax):

| Syntax | Purpose | Example |
|--------|---------|---------|
| `{{variable}}` | Simple interpolation | `Hello {{name}}` |
| `{{object.property}}` | Nested access | `{{agent.voice_id}}` |
| `{{#each items}}...{{/each}}` | Iteration | List generation |
| `{{#if condition}}...{{/if}}` | Conditional | Optional sections |
| `{{> partial}}` | Include partial | Reusable components |

Logic-less by design — business logic stays in TypeScript, not the template.

## Five Primitives

### 1. ROSTER — Agent & Skill Definitions
Data-driven generation of structured definitions from YAML (agent rosters, skill frontmatter, voice presets).

```handlebars
{{#each agents}}
### {{id}}: {{name}}
**Trait:** {{trait}}
**Perspective:** "{{perspective}}"
{{/each}}
```

### 2. VOICE — Personality Calibration
Parameterized voice/tone settings (stability, similarity_boost, archetype mapping).

```handlebars
"{{agent.id}}": {
  "stability": {{presets.[agent.archetype].stability}},
  "similarity_boost": {{presets.[agent.archetype].similarity_boost}}
}
```

### 3. STRUCTURE — Workflow Patterns
Standardized multi-step execution patterns (phased analysis, round-based debate, sequential pipelines).

```handlebars
{{#each phases}}
## Phase {{@index}}: {{name}}
**Purpose:** {{purpose}}
{{#each steps}}
### Step {{@index}}: {{action}}
{{instructions}}
{{/each}}
{{/each}}
```

### 4. BRIEFING — Agent Context Handoff
How agents receive tasks and context for delegation.

```handlebars
# {{briefing.type}} — {{agent.id}}: {{agent.name}}
You are {{agent.personality}}. Your perspective: "{{agent.perspective}}"
## Context
{{context.summary}}
## Your Task
{{#each briefing.questions}}
{{@index}}. {{this}}
{{/each}}
## Output Format
{{briefing.output_format}}
```

### 5. GATE — Validation Checklists
Reusable quality and completion checks.

```handlebars
### {{gate.name}} Checklist
{{#if gate.mandatory}}
**Mandatory (if any missing, {{gate.action_on_fail}}):**
{{/if}}
{{#each gate.items}}
- [ ] **{{name}}** — {{description}}
{{/each}}
```

## Layout

```
skills/Prompting/
├── Templates/
│   ├── Primitives/       # Core .hbs files (Roster, Voice, Structure, Briefing, Gate)
│   ├── Data/             # YAML data sources
│   └── Compiled/         # Generated output
└── Tools/                # RenderTemplate.ts, ValidateTemplate.ts
```

## Rendering

```bash
bun ~/.claude/skills/Prompting/Tools/RenderTemplate.ts \
  --template Primitives/Roster.hbs \
  --data Data/Agents.yaml \
  --output Compiled/AgentRoster.md
```

```typescript
import { renderTemplate } from '~/.claude/skills/Prompting/Tools/RenderTemplate.ts';
const output = renderTemplate('Primitives/Briefing.hbs', {
  agent: { id: 'EN-1', name: 'Skeptical Thinker', personality: '...' },
  briefing: { type: 'Analysis', questions: ['...'], output_format: '...' },
  context: { summary: '...' },
});
```

## Best Practices

- **Separation of concerns** — templates hold structure, YAML holds data, TS holds logic.
- **Keep templates simple** — no complex logic; use helpers for transforms.
- **Validate before rendering** — check required variables exist; test edge cases.
- **DRY** — extract repeated patterns into partials; single source of truth.

## References

- Anthropic: "Prompt templates and variables" — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompt-templates-and-variables
- Handlebars.js — https://handlebarsjs.com/
