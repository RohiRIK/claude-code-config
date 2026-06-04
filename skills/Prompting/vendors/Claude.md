---
type: documentation
category: methodology
description: Claude-specific prompting addendum. Layer on top of Core.md when the target model is Claude. Covers XML steering, imperative calibration, extended thinking, multi-context, vision.
---

# Vendor Addendum — Claude

Opt-in. Apply on top of `Core.md` when the target model is Claude. Stated as Claude-4.x-family principles, not pinned to one model — where behaviour differs by model eagerness, it is written as a conditional.

## XML Steering (Claude parses XML tags well)

Claude is trained to recognize XML-style tags as structure. Use them to delimit distinct parts of a prompt — they reduce the chance Claude confuses instructions with context or examples.

```xml
<instructions>
Summarize the document for an executive audience.
</instructions>

<document>
{{document_text}}
</document>

<output_format>
Three bullet points, each one sentence.
</output_format>
```

Guidance:
- Use XML tags to separate instructions, context, examples, and input — especially in long prompts.
- Tag names are arbitrary; be consistent and descriptive (`<document>`, `<example>`, `<scratchpad>`).
- Markdown and XML coexist — Markdown for prose/headings inside a block, XML to delimit blocks. Neither is mandatory; use whichever makes the structure clearest.
- This supersedes any older "Markdown only / never use XML" guidance.

## Imperative Calibration (avoid overtriggering)

More eager Claude models (Opus 4.5+) overtrigger on forceful language — they over-call tools and over-apply rules when prompts shout. Calibrate force to genuine stakes.

| Instead of | Use |
|------------|-----|
| "CRITICAL: You MUST use this tool when…" | "Use this tool when…" |
| "ALWAYS read the file first" | "Read the file before answering" |
| "NEVER do X" | "Do Y instead" (positive framing) |

Reserve `CRITICAL` / `MUST` / `NEVER` for genuine safety or irreversibility gates (secrets handling, destructive operations, data loss). Everywhere else, normal declarative phrasing steers better and avoids over-eager behaviour.

## Extended Thinking

When Claude's extended thinking is **enabled**, prefer it over manual chain-of-thought — ask for the answer and let thinking handle the reasoning.

When extended thinking is **disabled**, the literal words "think / think about / think through" can still nudge behaviour. Prefer "consider", "evaluate", "reflect", "assess". Guide reflection explicitly: "After receiving tool results, reflect on their quality and determine the best next step before proceeding."

## Multi-Context / Long-Horizon Work

- Claude tracks remaining context and auto-compacts near the limit — design long tasks to resume from filesystem state rather than relying on a single unbroken context.
- Persist state externally: JSON for structured data (tests, schemas), text for notes, git for checkpoints across sessions.
- A fresh context that rediscovers state from disk often beats a degraded, over-compacted one.
- For complex tasks: "Spend your entire output context working on the task."

## Tool & Agent Design

- Give each tool a single clear purpose and a description that says *when* to use it — not a forceful command to always use it.
- Claude delegates to subagents naturally when tool descriptions are clear; to restrict, say "Only delegate when the task clearly benefits from a separate context window."
- Each subagent gets minimal, task-specific context and an explicit success criterion.

## Parallel Execution

"If calling multiple tools with no dependencies between them, make all independent calls in parallel. Call sequentially only when one result feeds the next. Never guess parameters."

## Vision

Claude handles images and multi-image context well. For dense images, provide a crop/zoom step to focus on the relevant region. Break video into frames for analysis.

## Quick Transformations

| ❌ Avoid | ✅ Use |
|----------|--------|
| "CRITICAL: You MUST use this tool" | "Use this tool when…" |
| "Don't use markdown" | "Write in flowing prose paragraphs" |
| "NEVER do X" | "Do Y instead" |
| "Think about this carefully" (thinking off) | "Consider this carefully" |
| Forceful rule on a non-safety instruction | Plain declarative phrasing |

## References

- Anthropic: "Claude 4 Best Practices" — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices
- Anthropic: "Use XML tags to structure your prompts" — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags
- Anthropic: "Extended thinking tips" — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips
