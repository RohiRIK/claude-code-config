---
type: documentation
category: methodology
description: Universal, vendor-agnostic prompt-engineering principles. True for any capable LLM (Claude, OpenAI/Copilot, Gemini). No model or vendor pinning.
---

# Prompting Core — Universal Principles

Vendor-agnostic. These principles hold for any capable LLM. Provider-specific behaviour lives in `vendors/<Provider>.md` — never here.

## The Eight Principles

1. **Be explicit and specific.** State exactly what you want and the constraints that bound it. Vague input produces vague output. Replace "make it good" with "change X to achieve Y."
2. **Provide context and motivation.** Explain *why* a task matters and how the output is used. Models generalize well from stated reasoning. "This is read aloud by TTS, so avoid ellipses" beats "no ellipses."
3. **Structure deliberately.** Organize prompts into clear semantic sections (background, instructions, examples, constraints, output format). Use whichever structural markup the target model parses best — Markdown for prose, or steering tags where the provider supports them (see vendor addenda). The principle is *clear structure*, not a specific syntax.
4. **Show, don't just tell.** Include 1–3 few-shot examples for any non-trivial output format. Examples shape behaviour strongly — they must match the desired outcome exactly. Diminishing returns past ~3.
5. **Assign a role.** Open with "You are a…" to prime domain expertise and tone.
6. **Decompose complex tasks.** Break multi-step work into numbered, ordered steps. Order by priority or logical flow.
7. **Specify output format.** Show the exact shape you want back — schema, example, length bound. Format specification measurably reduces format errors.
8. **Treat context as finite.** Every token spends attention budget; performance degrades as context grows. Prefer high-signal, minimal context. Load detail just-in-time rather than dumping it upfront.

## Tell, Don't Forbid

Frame instructions positively. Give the model a target, not a void to avoid.

- Good: "Write smoothly flowing prose paragraphs with natural transitions."
- Weak: "Do not use markdown or bullet points."

Positive framing yields a clear target; pure prohibitions leave the model guessing what TO do.

## Match Prompt Style to Output Style

Prompt formatting influences output formatting. Heavy markdown in the prompt nudges markdown in the response; prose-style prompts nudge prose. Shape the input to model the output you want.

## Signal-to-Noise

- Prefer direct language over verbose explanation.
- Remove redundant or overlapping instructions.
- Cut historical context ("how we got here") unless it changes the task.
- Load data when needed, not preemptively.

## Quick Reference

| Goal | Technique |
|------|-----------|
| Precise output | Explicit instructions + output-format spec |
| Complex task | Decomposition into ordered steps |
| Consistent format | 1–3 few-shot examples |
| Domain expertise | Role assignment |
| Large reference material | Context-first placement, just-in-time loading |
| Reliable behaviour | Positive framing (tell, don't forbid) |

## Universal Anti-Patterns

- Vague instructions ("make it better").
- Missing context / no stated motivation.
- No examples for a complex output format.
- Misaligned examples (they shape behaviour — wrong examples cause wrong behaviour).
- Negative-only constraints (say what TO do).
- Premature/bulk context loading.
- Example overload (10 where 2 suffice).

## Where to Go Next

- Need a structural scaffold? → `Frameworks.md` (COSTAR / RISEN / RTF)
- Need a reasoning technique? → `Reasoning.md` (few-shot, CoT, ReAct, self-consistency)
- Targeting a specific model? → `vendors/Claude.md`, `vendors/OpenAI.md`, `vendors/Gemini.md`
- Want a fill-in template? → `Templates.md`

## References

- Anthropic: "Claude 4 Best Practices" — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices
- Anthropic: "Effective Context Engineering for AI Agents" — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- "The Prompt Report" — arXiv:2406.06608 (systematic survey, 58 techniques)
- "The Prompt Canvas" — arXiv:2412.05127
