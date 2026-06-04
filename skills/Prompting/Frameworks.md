---
type: documentation
category: methodology
description: Named structural prompt frameworks (COSTAR, RISEN, RTF). Vendor-agnostic scaffolds for laying out a prompt. Pick one, then layer a reasoning technique from Reasoning.md.
---

# Prompt Frameworks — Structural Scaffolds

A framework is a fixed layout for a prompt's sections. These are **structural** and mutually exclusive — pick **one** per prompt. They are vendor-agnostic.

Reasoning techniques (few-shot, chain-of-thought, ReAct, self-consistency) are **orthogonal** — they layer on top of any frame. They are NOT frameworks. See `Reasoning.md`.

## Selection

| Frame | Fields | Best for |
|-------|--------|----------|
| **RTF** | Role, Task, Format | Trivial one-liners, quick asks |
| **COSTAR** | Context, Objective, Style, Tone, Audience, Response | General prompts, content, comms |
| **RISEN** | Role, Instructions, Steps, End-goal, Narrowing | Agentic / multi-step / coding tasks |

Rule of thumb: trivial → RTF; content or human-facing output → COSTAR; agent/task with steps and a goal → RISEN.

## RTF — Role, Task, Format

Minimal scaffold for simple requests.

- **Role** — who the model should act as.
- **Task** — the single thing to do.
- **Format** — the shape of the answer.

```
Role: You are a senior copy editor.
Task: Tighten this paragraph without changing meaning.
Format: Return only the revised paragraph.
```

## COSTAR — Context, Objective, Style, Tone, Audience, Response

Complete scaffold for general and human-facing work. Its tone/audience axes are what RTF and RISEN skip.

- **Context** — background the model needs.
- **Objective** — the specific goal.
- **Style** — writing style (e.g. technical, journalistic, terse).
- **Tone** — emotional register (e.g. formal, friendly, urgent).
- **Audience** — who reads the output.
- **Response** — output format/shape.

```
# Context
We are launching a B2B analytics product next week.
# Objective
Write a launch announcement.
# Style
Confident, concrete, no hype.
# Tone
Professional but warm.
# Audience
Technical decision-makers (CTOs, eng leads).
# Response
3 short paragraphs, no bullet lists.
```

## RISEN — Role, Instructions, Steps, End-goal, Narrowing

Task scaffold for agentic and coding work. Steps + end-goal + narrowing make it a precise task spec.

- **Role** — the expert persona.
- **Instructions** — what to do, overall.
- **Steps** — ordered actions to follow.
- **End-goal** — the success condition.
- **Narrowing** — constraints, scope limits, what to avoid.

```
# Role
You are a backend engineer fixing a production bug.
# Instructions
Diagnose and fix the session-expiry bug in the auth module.
# Steps
1. Read the session middleware and token logic.
2. Reproduce the early-expiry condition.
3. Patch the comparison and add a regression test.
# End-goal
Sessions expire at the configured TTL, verified by a passing test.
# Narrowing
Touch only the auth module. No refactors. No new dependencies.
```

## Combining a Frame with Reasoning

Frame sets the *layout*; a reasoning technique sets the *thinking pattern* inside it.

- COSTAR + few-shot → add 1–3 examples in the Response section.
- RISEN + chain-of-thought → ask for reasoning before the answer in Instructions.
- RISEN + ReAct → interleave reasoning and tool calls across Steps.

See `Reasoning.md` for the techniques.
