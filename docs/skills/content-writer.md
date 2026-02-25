# ContentWriter

**Skill:** Blog, LinkedIn, and X/Twitter content creation.

**Description:** Write blog posts, LinkedIn posts, X/Twitter threads, and other content. USE WHEN writing content, blog post, LinkedIn post, X thread, or social media post.

---

## Overview

The ContentWriter skill creates polished content for Blog, LinkedIn, and X/Twitter platforms.

## Workflow Routing

| Trigger Keywords | Workflow |
|-----------------|----------|
| "blog post", "article" | Blog.md |
| "LinkedIn post", "LinkedIn article" | LinkedIn.md |
| "X thread", "Twitter thread", "tweet thread" | XThread.md |

## Rules

1. **Always load `Voice.md` first** — tone, style, audience
2. **One platform per invocation** — ask if ambiguous
3. **Draft → Review → Refine loop** before final output
4. **English by default** — Hebrew when asked (`בעברית`)

## Output Location

Saved to: `~/Documents/Posts/YYYY-MM-DD-platform-slug.md`

## Process

1. Load voice/tone guidelines
2. Draft content for platform
3. Review against guidelines
4. Refine until polished
5. Save to Posts folder

## Platform Guidelines

### Blog
- Longer form (1000-2000 words)
- Structured with headings
- Code examples where relevant

### LinkedIn
- Professional tone
- Short paragraphs
- Engaging hook
- Call to action

### X/Twitter Thread
- Punchy, concise
- Thread format
- Hook in first tweet
- Conclusion with CTA

## Related

- **Used by:** [doc-updater agent](../agents/doc-updater.md)
- **See also:** [Prompting skill](prompting.md)

---

*Documentation generated from `skills/ContentWriter/SKILL.md` - Last updated: 2026-02-25*
