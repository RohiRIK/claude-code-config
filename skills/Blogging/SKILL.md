---
name: Blogging
description: "USE WHEN writing a new blog post for cloudjourneyblog."
---

# Blogging

Skill for writing, structuring, and wiring up blog posts for the `03-cloudjourneyblog` Next.js site.

Handles the full pipeline: source selection → research → MDX authoring → image prompt generation (via Art skill) → pre-commit wire check.

## Workflow Routing

| Workflow | Trigger | File |
|---------|---------|------|
| **WritePost** | "write a blog post", "new post", "next post from pipeline", "blog about X" | `Workflows/WritePost.md` |

## Quick Reference

- Blog posts: `src/app/blog/posts/<slug>.mdx`
- Image prompts: `public/images/blog/PROMPTS.md`
- Post images: `public/images/blog/<slug>.png`
- Pipeline tracker: `BLOG_PIPELINE.md`

## Examples

**Example 1: Pipeline post**
```
User: "Write the next blog post"
→ Invokes WritePost workflow
→ Picks next Tier 1 item from BLOG_PIPELINE.md
→ Researches, writes MDX, generates image prompt via Art skill
```

**Example 2: Custom idea**
```
User: "Write a blog post about phishing-resistant MFA rollout"
→ Invokes WritePost workflow
→ Researches topic, writes MDX
→ Generates image prompt via Art skill, appends to PROMPTS.md
```

**Example 3: Resume from image step**
```
User: "Image is done, wire it up"
→ Invokes WritePost workflow at wire check step
→ Verifies image exists, frontmatter matches, build passes, then commits
```
