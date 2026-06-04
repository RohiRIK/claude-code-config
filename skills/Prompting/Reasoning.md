---
type: documentation
category: methodology
description: Reasoning techniques (few-shot, chain-of-thought, ReAct, self-consistency). Orthogonal to structural frameworks — layer one on top of any frame from Frameworks.md.
---

# Reasoning Techniques — The Orthogonal Toolbox

These are **not** structural frameworks. A framework (`Frameworks.md`) sets a prompt's *layout*; a reasoning technique sets the *thinking pattern* inside it. You pick exactly one frame, then optionally layer one or more of these techniques on top. They are vendor-agnostic.

| Technique | What it does | Use when |
|-----------|--------------|----------|
| **Few-shot** | Provide 1–3 examples of input→output | Output format must be consistent or non-obvious |
| **Chain-of-thought (CoT)** | Ask for step-by-step reasoning before the answer | Multi-step reasoning, math, logic, planning |
| **ReAct** | Interleave reasoning and tool/action calls | Agentic tasks with tools and observations |
| **Self-consistency** | Sample multiple reasoning paths, take the majority | High-stakes answers where one path may err |

## Few-Shot

Show 1–3 representative examples. Diminishing returns past 3. Examples shape behaviour strongly — they must match the desired outcome exactly; a misaligned example teaches the wrong thing.

```
Input: "The food was cold." → Sentiment: negative
Input: "Loved every bite!"  → Sentiment: positive
Input: "It was fine."       → Sentiment:
```

## Chain-of-Thought

Prompt the model to reason before answering. On models with native extended/thinking modes, prefer the provider's thinking feature over manual CoT (see vendor addenda). When thinking is off, manual CoT still helps.

```
Work through this step by step, then give the final answer.
```

Note: on some models, the literal word "think" triggers special behaviour. Where that matters, the vendor addendum says so — use "consider", "evaluate", or "reflect" instead.

## ReAct (Reason + Act)

For agents: alternate Thought → Action → Observation until the goal is met. Pairs naturally with the RISEN frame's Steps section.

```
Thought: I need the current config to know the TTL.
Action: read auth/config.ts
Observation: TTL = 3600s
Thought: The comparison uses < instead of <=. Fix it.
Action: edit auth/session.ts
```

## Self-Consistency

Sample the same CoT prompt several times and take the majority answer. Trades cost for reliability on high-stakes or error-prone reasoning. Apply at the orchestration layer (run N times, vote), not inside a single prompt.

## Layering Examples

- COSTAR + few-shot — examples in the Response section.
- RISEN + CoT — "reason step by step" in Instructions.
- RISEN + ReAct — Thought/Action/Observation across Steps.
- Any frame + self-consistency — run the prompt N times externally, vote.
