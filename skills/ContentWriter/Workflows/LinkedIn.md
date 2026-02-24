# LinkedIn Post Workflow

## Step 1: Load Voice
Read `~/.claude/skills/ContentWriter/Voice.md` — apply tone, LinkedIn-specific notes.

## Step 2: Opening Line (Critical)
LinkedIn shows ~2 lines before "see more". The hook must compel the click.
Options:
- Bold claim: "Most [topic] advice is wrong."
- Question: "Why does [X] keep failing?"
- Story hook: "Last week I [did X]. Here's what happened."
- Stat: "[Number]% of [audience] don't know [surprising fact]."

## Step 3: Draft Structure
```
[Hook line — 1 sentence, standalone]

[2-3 short paragraphs expanding the insight, 1-3 lines each]

[Key takeaway — 1-2 sentences]

[CTA — per Voice.md]
```

## Step 4: Format Rules
- Short paragraphs — LinkedIn rewards white space
- Emoji use: per Voice.md preference
- Target: 150-300 words

## Step 5: Self-Review Checklist
- [ ] First line works standalone (no "see more" needed to understand hook)
- [ ] Matches tone from Voice.md
- [ ] White space between every paragraph
- [ ] Avoids jargon listed in "What I Avoid"

## Step 6: Output & Save
Present the post. Save to `~/.claude/skills/ContentWriter/Output/YYYY-MM-DD-linkedin-<slug>.md` with frontmatter: `platform: linkedin`, `date`, `language: en/he`. Then ask: "Want to adjust the hook or CTA?"
