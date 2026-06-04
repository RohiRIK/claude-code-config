---
name: Prompting
description: "Vendor-agnostic prompt-engineering standard library. USE WHEN authoring or refining a prompt, system message, skill, agent instruction, or rule file."
user-invocable: false
---

# Prompting

The standard library for prompt engineering. Vendor-agnostic core plus opt-in per-model addenda. Load this before writing any system prompt, rule file, skill content, agent instruction, or user-facing prompt — and for prompts targeting any LLM, not just Claude.

## How to Use

1. Read `Core.md` — the universal principles (true for any capable LLM).
2. Pick a structural frame from `Frameworks.md` (COSTAR / RISEN / RTF).
3. Optionally layer a technique from `Reasoning.md` (few-shot, CoT, ReAct, self-consistency).
4. Apply the addendum for your target model: `vendors/Claude.md`, `vendors/OpenAI.md`, or `vendors/Gemini.md`.
5. Need a skeleton? Use `Templates.md`. Generating prompts from data? Use `TemplatingSystem.md`.

## Map

| File | Load when you need… |
|------|--------------------|
| `Core.md` | The universal principles — start here |
| `Frameworks.md` | A structural scaffold (COSTAR / RISEN / RTF) |
| `Reasoning.md` | A reasoning technique to layer on a frame |
| `Templates.md` | A fill-in prompt skeleton + section matrix |
| `TemplatingSystem.md` | Programmatic Handlebars template generation |
| `vendors/Claude.md` | Claude target — XML steering, imperative calibration, thinking |
| `vendors/OpenAI.md` | GPT / Copilot target |
| `vendors/Gemini.md` | Gemini target |

## Two-Layer Principle

The **core is vendor-agnostic and durable** — no model or vendor pinning. Provider-specific behaviour (Claude's XML steering and imperative calibration, OpenAI's role/JSON-mode conventions, Gemini's prefix style) lives only in `vendors/*`. A model swap within a family, or authoring for a different vendor, means selecting a different addendum — never rewriting the core.

## Tools

- `Tools/RenderTemplate.ts` — render a Handlebars template against YAML data.
- `Tools/ValidateTemplate.ts` — validate template syntax against sample data.

See `TemplatingSystem.md` for usage.
