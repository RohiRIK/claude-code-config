---
type: documentation
category: methodology
description: Index/redirect — the prompt-engineering standard library was split into focused files. Start at Core.md.
---

# Prompt Engineering Standards — Index

This file was a single 1200-line document. It is now split into focused, progressively-disclosed files. Load only what you need.

| File | Contents |
|------|----------|
| `Core.md` | Universal, vendor-agnostic principles (the eight principles, tell-don't-forbid, signal-to-noise) |
| `Frameworks.md` | Structural frameworks — COSTAR, RISEN, RTF — and how to pick one |
| `Reasoning.md` | Reasoning techniques (few-shot, chain-of-thought, ReAct, self-consistency) — orthogonal to frameworks |
| `Templates.md` | Fill-in prompt skeletons + section-selection matrix |
| `TemplatingSystem.md` | Handlebars programmatic templating engine (ROSTER/VOICE/STRUCTURE/BRIEFING/GATE) |
| `vendors/Claude.md` | Claude-specific: XML steering, imperative calibration, extended thinking, multi-context, vision |
| `vendors/OpenAI.md` | OpenAI / GitHub Copilot conventions |
| `vendors/Gemini.md` | Google Gemini conventions |

**Start at `Core.md`.** Pick a frame from `Frameworks.md`, optionally layer a technique from `Reasoning.md`, and apply the relevant `vendors/*` addendum for your target model.
