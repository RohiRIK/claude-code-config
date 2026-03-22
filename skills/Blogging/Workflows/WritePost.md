# WritePost Workflow

Full end-to-end workflow for writing and shipping a blog post on `03-cloudjourneyblog`.

---

## Step 1 — Source Selection

Ask the user:

> "Pipeline idea or your own?"

**Pipeline** → open `BLOG_PIPELINE.md`, pick the next **Tier 1** item that is not yet published.
Present the item title, angle, and tag to the user for confirmation before proceeding.

**Own idea** → user describes the topic. Note the concept, angle, and intended tag.

---

## Step 2 — Research

Before writing, research the topic:

- For pipeline posts: the brief in `BLOG_PIPELINE.md` has the context. Use it.
- For custom ideas: use `mcp__ltm__ltm_recall` to check prior related patterns, then web search if needed for technical accuracy.
- Sanitize any real client names using the key in `BLOG_PIPELINE.md` — never publish real client names.

---

## Step 3 — Write the MDX Post

Create the file at:
```
src/app/blog/posts/<slug>.mdx
```

### Frontmatter (required fields)
```mdx
---
title: "Post Title Here"
summary: "1-2 sentence summary for cards and SEO."
image: "/images/blog/<slug>.png"
publishedAt: "YYYY-MM-DD"
tag: "Tag"
---
```

### Content guidelines
- Write in first person, technical and direct — no fluff
- Structure: problem → context → solution/architecture → takeaway
- Use headers, code blocks, and lists where they aid clarity
- Length: 800–1500 words typical
- No real client names — use sanitized names from `BLOG_PIPELINE.md`

---

## Step 4 — Image Prompt (Art Skill)

Invoke the **Art skill** to generate the image prompt.

Provide it:
- The post concept (problem type: e.g. MISDIRECTION, TRANSFORMATION, LOOP)
- The post title and slug
- The existing style reference: "Nano Banana — cyberpunk/retrofuturism, bold flat colors, neon accents, dark near-black backgrounds, no text, no gradients, hard edges"

The Art skill will produce a full image prompt.

Then **append** to `public/images/blog/PROMPTS.md`:

1. Add `[ ] N. <slug>.png` to the **Generation Checklist** at the top (increment N)
2. Add a new section at the bottom:

```markdown
## N. <slug>.png

**Concept:** [PROBLEM TYPE] problem type.
[1-2 sentence concept description]

**Prompt:**

[Full prompt from Art skill]

---
```

**Pause here.** Tell the user:
> "Prompt is ready in PROMPTS.md. Generate the image in Gemini (Imagen 3) and save it to `public/images/blog/<slug>.png`, then let me know."

---

## Step 5 — Wire Check

Once the user confirms the image is saved, verify everything before committing:

### Checklist
- [ ] `src/app/blog/posts/<slug>.mdx` exists
- [ ] Frontmatter `image` field = `/images/blog/<slug>.png`
- [ ] `public/images/blog/<slug>.png` exists on disk
- [ ] `public/images/blog/PROMPTS.md` checklist entry added (unchecked `[ ]`)
- [ ] `BLOG_PIPELINE.md` updated — move post to `## ✅ Published` section
- [ ] `bun run build` passes with no errors

Run the build:
```bash
bun run build
```

If build fails → fix errors before proceeding.

---

## Step 6 — Commit

Once all wire checks pass, commit with a conventional message:

```
feat: add <slug> blog post
```

Push and confirm.

---

## Rules

- Never commit if `public/images/blog/<slug>.png` does not exist — build will not break but the post will have a broken image
- Never use real client names — always use sanitized aliases from `BLOG_PIPELINE.md`
- Always run `bun run build` before committing — catches MDX parse errors early
- The Art skill owns prompt generation — do not freehand write Nano Banana prompts
