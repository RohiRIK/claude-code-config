# Workflow: GenerateImage

Agy's standout feature: generate (or edit) images with **Nano Banana** (Gemini
image models) and report where the file landed. Use it for logos, UI mockups,
diagrams, illustrations, or any asset the user asks for.

## 1. Preflight (one-time setup must already be done)

```bash
agy inspect | grep -i 'nano\|banana\|plugin\|skill'   # confirm nano-banana is loaded
printenv | grep -E 'NANOBANANA_API_KEY|GEMINI_API_KEY' >/dev/null \
  && echo "image key present" || echo "NO image key — see Reference.md"
```

If nano-banana is not listed, do the setup in `Reference.md` → Image Generation
(`gemini extensions install …nanobanana` + `agy plugin import gemini` + set the
Gemini API key), then re-check.

**Model:** default is `gemini-3.1-flash-image-preview` (Nano Banana 2). For higher
fidelity (mockups, detailed art) set `NANOBANANA_MODEL=gemini-3-pro-image-preview`
before the run.

## 2. Decide the output location first

State the absolute output path in the prompt so you can verify the file afterward.
Default to a sensible dir (e.g. the project's `assets/` or `/tmp` for throwaways).

## 3. Generate (headless print mode)

The agent invokes the image tool from a natural-language prompt. Be explicit about
subject, style, aspect ratio, count, and the save path:

```bash
timeout 300 agy -p 'Generate an image: a minimalist line-art fox logo, flat color, \
transparent background, square 1:1. Save it to /path/to/assets/fox-logo.png.' \
  --add-dir /path/to/project
```

For multiple variations, ask for N images with distinct filenames in one prompt.
To **edit** an existing image, name the input file(s) and the change:

```bash
timeout 300 agy -p 'Edit /path/to/assets/fox-logo.png: change the background to \
deep navy and export at 2x resolution. Save as fox-logo-navy.png.' \
  --add-dir /path/to/assets
```

> First time only: run an equivalent `/generate "<prompt>"` inside an interactive
> `agy` session to confirm the tool writes a file, then trust the headless path.

## 4. Report back

- Verify the file exists and its size: `ls -lh <output-path>`.
- Report the path(s) and dimensions. Offer to open it or generate variations.
- Image files are binary assets — do not commit them automatically; let the user
  decide what to keep (and mind any repo `.gitignore` rules for binaries).
