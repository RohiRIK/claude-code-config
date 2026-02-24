# X / Twitter Thread Workflow

## Step 1: Load Voice
Read `~/.claude/skills/ContentWriter/Voice.md` — apply tone and X-specific notes.

## Step 2: Thread Hook (Tweet 1 — Critical)
First tweet must stop the scroll. Options:
- Hot take: "[Controversial claim] (thread)"
- Question: "Why does [X] keep failing? I found out."
- Stat: "[Number] [surprising fact]. Here's why it matters:"
- Story: "I [did X]. What happened next surprised me."

Always end tweet 1 with a continuation signal: "Here's what I learned:" / "(thread)" / "↓"

## Step 3: Thread Structure
```
Tweet 1: Hook (< 280 chars, ends with continuation signal)
Tweet 2: Context — why this matters
Tweet 3-N: Core insight as numbered points (1/, 2/, 3/...), one idea each
Tweet N-1: Synthesis / key takeaway
Tweet N: Sign-off + CTA (per Voice.md)
```

## Step 4: Format Rules
- Each tweet < 280 characters
- Number tweets in body: "2/ One insight per tweet..."
- No filler — every tweet earns its place
- Thread length: 5-12 tweets (per Voice.md)

## Step 5: Self-Review Checklist
- [ ] Tweet 1 works standalone as a hook
- [ ] Each tweet is self-contained (readable out of context)
- [ ] No tweet exceeds 280 chars
- [ ] Tone matches Voice.md
- [ ] Sign-off tweet present

## Step 6: Output & Save
Present numbered tweets (1/, 2/, 3/...). Save to `~/.claude/skills/ContentWriter/Output/YYYY-MM-DD-x-<slug>.md` with frontmatter: `platform: x`, `date`, `tweets: <count>`. Then ask: "Want to adjust the hook or add/remove tweets?"
