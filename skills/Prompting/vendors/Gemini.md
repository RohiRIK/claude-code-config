---
type: documentation
category: methodology
description: Google Gemini prompting addendum. Layer on top of Core.md when targeting Gemini models. Opt-in vendor-specific conventions.
---

# Vendor Addendum — Google Gemini

Opt-in. Apply on top of `Core.md` when the target is a Gemini model (Gemini API, Vertex AI, Google AI Studio). Universal principles in `Core.md` still apply; this file records only Gemini-specific conventions.

## Structure

- Gemini responds well to clear prefixes and section labels. Use explicit prefixes like `Task:`, `Context:`, `Input:`, `Output:`.
- A `systemInstruction` field carries persona and standing rules separately from the user turn — use it for durable instructions.
- Markdown structure is idiomatic; XML delimiters are not required.

## Few-Shot

Gemini benefits strongly from consistent few-shot examples with a fixed prefix pattern (same labels every time). Keep the input/output delimiters identical across examples.

## Long Context & Multimodal

- Gemini's large context window suits long-document and multi-file tasks — but `Core.md`'s finite-attention principle still holds; place the most important instruction near the end of a very long prompt.
- Strong native multimodal support (image, audio, video, PDF). Reference media directly; for video, you can ask about specific timestamps.

## Output Control

- Use `responseSchema` / structured output config for strict JSON rather than relying on prose description alone.
- Temperature and top-p are exposed — lower temperature for deterministic/extraction tasks.

## Frameworks & Reasoning

Structural frameworks (`Frameworks.md`) and reasoning techniques (`Reasoning.md`) are vendor-agnostic and apply unchanged.

## References

- Google: "Prompt design strategies" — https://ai.google.dev/gemini-api/docs/prompting-strategies
- Google: "Structured output" — https://ai.google.dev/gemini-api/docs/structured-output
