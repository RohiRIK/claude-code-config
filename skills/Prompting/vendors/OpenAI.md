---
type: documentation
category: methodology
description: OpenAI / GitHub Copilot prompting addendum. Layer on top of Core.md when targeting GPT models or Copilot. Opt-in vendor-specific conventions.
---

# Vendor Addendum — OpenAI / GitHub Copilot

Opt-in. Apply on top of `Core.md` when the target is a GPT model (ChatGPT, OpenAI API) or GitHub Copilot. Universal principles in `Core.md` still apply; this file records only OpenAI-specific conventions.

## Message Roles

OpenAI models are tuned around explicit roles. Put durable instructions in the **system** (or **developer**) message and the task in the **user** message.

- **system / developer** — persona, rules, output contract. Stable across turns.
- **user** — the actual request and its data.
- **assistant** — prior responses (for few-shot, supply example assistant turns).

## Structure

- Markdown headings and numbered lists are the idiomatic structure. GPT models do not need XML delimiters the way Claude benefits from them, though XML/backticked fences still work to separate input from instructions.
- For strict output shape, use **Structured Outputs / JSON mode** (a `response_format` JSON schema) rather than only describing the format in prose.

## Reasoning Models (o-series)

- For o-series reasoning models, keep prompts direct and avoid manual "think step by step" — the model reasons internally. Over-prompting reasoning can hurt.
- For standard GPT models, chain-of-thought prompting still helps on multi-step tasks.

## GitHub Copilot Specifics

- Copilot Chat reads workspace context — reference files and symbols by name; it resolves them.
- `.github/copilot-instructions.md` holds repo-level standing instructions, analogous to a system prompt.
- Inline completions are steered by surrounding code and comments — a clear comment above the cursor acts as the prompt.

## Frameworks & Reasoning

Structural frameworks (`Frameworks.md`) and reasoning techniques (`Reasoning.md`) are vendor-agnostic and apply unchanged. COSTAR and RISEN map cleanly onto a system+user message split.

## References

- OpenAI: "Prompt engineering" — https://platform.openai.com/docs/guides/prompt-engineering
- OpenAI: "Structured Outputs" — https://platform.openai.com/docs/guides/structured-outputs
- GitHub: "Prompt engineering for Copilot Chat" — https://docs.github.com/en/copilot
