/**
 * DestructiveGitGuard — PreToolUse guard for irreversible git commands.
 *
 * Matcher (settings.json) pre-filters to Bash commands containing "git".
 * This hook inspects the command and blocks the ones that can destroy work
 * without an easy undo, telling Claude to confirm with the user first.
 * Safe git (status, add, commit, push, pull, force-with-lease) passes through.
 */

import { readStdin, parseHookInput } from "../lib/hookUtils.ts";

const raw = await readStdin();
const parsed = parseHookInput(raw);
const command: string = parsed?.input?.tool_input?.command ?? "";
if (!command) process.exit(0);

// Each rule: a label + a regex. Anchored on the git subcommand to avoid
// matching the same words inside a commit message or quoted string.
const RULES: { label: string; re: RegExp }[] = [
  {
    label: "force-push (overwrites remote history)",
    // --force / -f, but allow the safer --force-with-lease
    re: /git\s+push\b(?![^|;&]*--force-with-lease)[^|;&]*(?:--force\b|-f\b)/,
  },
  { label: "reset --hard (discards uncommitted work)", re: /git\s+reset\b[^|;&]*--hard\b/ },
  { label: "clean -f (deletes untracked files)", re: /git\s+clean\b[^|;&]*-[a-zA-Z]*f/ },
  {
    label: "branch -D / --delete --force (force-deletes a branch)",
    re: /git\s+branch\b[^|;&]*(?:-D\b|--delete\s+--force\b|--force\s+--delete\b)/,
  },
  {
    label: "checkout/restore . (discards changes in working tree)",
    re: /git\s+(?:checkout|restore)\b[^|;&]*(?:^|\s)(?:--\s+)?\.(?:\s|$)/,
  },
  { label: "--no-verify (skips pre-commit secret/path scans)", re: /git\s+[^|;&]*--no-verify\b/ },
];

const hit = RULES.find((r) => r.re.test(command));
if (!hit) process.exit(0);

process.stderr.write(`[DestructiveGitGuard] BLOCKED: ${hit.label}\n`);
process.stderr.write(`[DestructiveGitGuard] Command: ${command}\n`);
process.stderr.write(
  "[DestructiveGitGuard] This is hard to undo. Confirm with the user explicitly before re-running,\n",
);
process.stderr.write(
  "[DestructiveGitGuard] or use a safer alternative (e.g. --force-with-lease, git stash, a backup branch).\n",
);
process.exit(2);
