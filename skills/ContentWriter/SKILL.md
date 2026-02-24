---
name: ContentWriter
description: Write blog posts, LinkedIn posts, X/Twitter threads, and other content. USE WHEN writing content, blog post, LinkedIn post, X thread, Twitter thread, social media post, article, or publish content.
---

# ContentWriter

Creates polished content for Blog, LinkedIn, and X/Twitter. One platform per invocation.

## Routing

| Trigger keywords | Workflow |
|-----------------|----------|
| "blog post", "article", "write a post" | `Workflows/Blog.md` |
| "LinkedIn post", "LinkedIn article" | `Workflows/LinkedIn.md` |
| "X thread", "Twitter thread", "tweet thread" | `Workflows/XThread.md` |

## Rules

- **Always load `Voice.md` first** — tone, style, audience
- **One platform per invocation** — ask if ambiguous
- Draft → Review → Refine loop before final output
- English by default. Hebrew when asked ("בעברית", "in Hebrew") — same voice
- Output saved to `~/Documents/Posts/YYYY-MM-DD-platform-slug.md`
