# Workflow: ReviewPR

Use OpenCode to review a GitHub PR or a local diff and report findings.
Review is read-only — OpenCode should not edit code here.

## Option A — GitHub PR by number (preferred)

`opencode pr <number>` fetches and checks out the PR branch, then runs opencode
in it. Run the review non-interactively against the checked-out branch:

```bash
# 1. Checkout the PR branch (run in the target repo)
opencode pr 1234 --dir /path/to/repo

# 2. Review the diff vs the base branch, read-only
timeout 300 opencode run 'Review the changes on this branch vs origin/main. Report, by severity: \
correctness bugs, security risks, missing tests, and API/style inconsistencies. \
Do not modify any files.' \
  --dir /path/to/repo \
  --agent plan
```

`gh` is also fine if you prefer: `gh pr checkout 1234` then the `opencode run` step.

## Option B — Throwaway clone (review without touching local repo)

```bash
REVIEW=$(mktemp -d)
git clone <repo-url> "$REVIEW"
timeout 300 opencode run 'Review this PR vs main. Report bugs, security risks, test gaps, \
and style issues. Read-only.' \
  --dir "$REVIEW" \
  --agent plan \
  -f $(git -C "$REVIEW" diff origin/main --name-only | head -20 | tr '\n' ' ')
rm -rf "$REVIEW"     # clean up after
```

## Option C — Local diff already in tree

```bash
timeout 300 opencode run 'Review the staged and unstaged changes. Report correctness bugs, \
security risks, and missing tests by severity. Read-only.' \
  --dir /path/to/repo \
  --agent plan
```

## Reporting

- Use `--agent plan` so OpenCode reviews without writing files.
- Relay OpenCode's findings grouped by severity (critical / high / medium / low).
- Add your own read of anything OpenCode missed; do not auto-apply fixes — that is
  a separate `Delegate` task the user approves.
