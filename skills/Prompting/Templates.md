---
type: documentation
category: methodology
description: Fill-in prompt templates and a section-selection matrix. Vendor-agnostic skeletons for simple, agentic, and research prompts. For Claude XML steering see vendors/Claude.md.
---

# Prompt Templates

Modular skeletons — include only the sections your task needs. Vendor-agnostic; when targeting Claude, you may wrap sections in XML tags (see `vendors/Claude.md`).

## Section Selection Matrix

| Task type | Required | Recommended | Optional |
|-----------|----------|-------------|----------|
| Simple query | Instructions, Output Format | Context | — |
| Complex implementation | Context, Instructions, Output Format, Tools | Examples, Constraints, Verification | Action Bias, Parallel |
| Research / analysis | Context, Instructions, Constraints | Examples, Research Mode | State Tracking |
| Agentic coding | Context, Instructions, Tools, Verification | Constraints, Parallel | State Tracking |
| Long-horizon multi-context | Context, Instructions, State Tracking | Verification, Parallel | as needed |

## Full Template

```markdown
# [Task Name]

## Context & Motivation
[WHY this matters — models generalize from stated reasoning. 1–3 sentences.]

## Background
[Minimal essential domain context. Every token spends attention.]

## Instructions
[Positive framing — tell what TO do. Ordered by priority.]
1. [First directive]
2. [Second directive]

## Examples
[1–3 examples. They must match the desired output exactly.]
**Example 1: [Scenario]**
- Input: [input]
- Output: [exact desired output]

## Constraints
- [What TO do / boundary]
- **Success:** [completion criterion]
- **Failure:** [failure criterion]

## Output Format
[Exact structure: schema, markdown, prose. Length bound if any.]

## Tools
[Describe when to use each — not a forceful command to always use.]
- `tool_name(params)` — Use when [condition].

## Action Bias
[Pick one]
- Implementation: implement rather than suggest; use tools to discover missing details.
- Research: gather and recommend; verify across sources before concluding.

## Execution Patterns
- Parallel: make independent calls in parallel; sequential only when dependent.
- Verification: read before edit; verify before reporting done.

## State Tracking
[Multi-step/multi-context: JSON for structured state, text for notes, git for checkpoints.]
```

## Minimal Template (simple tasks)

```markdown
# [Task Name]

## Context
[Why this matters — one sentence]

## Instructions
[Clear directives]

## Output Format
[Exact format]
```

## Agentic Template (coding)

```markdown
# [Task Name]

## Context
[Purpose and why specific behaviours matter]

## Instructions
1. [Primary objective]
2. [Secondary requirements]

### Verification
Read relevant files before proposing changes. Verify changes work before reporting completion.

### Parallel Execution
Make independent tool calls in parallel; sequential only when dependent.

## Tools
- `tool(params)` — Use when [condition]

## Constraints
- Implement the minimum complexity needed
- Reuse existing abstractions
- Remove temporary files when done

## Output Format
[Format specification]
```

## Research Template

```markdown
# [Research Task]

## Context
[What question needs answering and why]

## Instructions
1. [Primary research objective]
2. [Scope boundaries]

### Research Mode
Verify across multiple sources. Develop competing hypotheses. Track confidence. Synthesize.

## Success Criteria
- **Success:** [what a complete answer looks like]
- **Sources:** [verification requirements]

## Output Format
[Summary, evidence, confidence, sources]
```

## Why This Works

- Background + Instructions + Output Format = baseline performance.
- 1–3 examples add the largest single improvement; diminishing returns past 3.
- Constraints reduce hallucination; explicit output format improves compliance.
- Positive framing gives a clear target; minimal context preserves attention budget.

For the Handlebars-based programmatic templating engine (ROSTER/VOICE/STRUCTURE/BRIEFING/GATE primitives), see `TemplatingSystem.md`.
