/**
 * SecretScanOnWrite — PostToolUse warning for secrets written to disk.
 *
 * Matcher (settings.json) fires on Write|Edit. Greps the just-written file for
 * common credential signatures and warns Claude at write-time (the pre-commit
 * varlock scan is the backstop). Skips gitignored files (e.g. .env) — those are
 * allowed to hold secrets.
 */

import { readStdinPassthrough, parseHookInput } from "../lib/hookUtils.ts";
import { existsSync } from "fs";

const raw = await readStdinPassthrough();
const parsed = parseHookInput(raw);
const filePath: string = parsed?.input?.tool_input?.file_path ?? "";
if (!filePath || !existsSync(filePath)) process.exit(0);

// Gitignored files may legitimately hold secrets — skip them.
try {
  const ignored = Bun.spawnSync(["git", "check-ignore", "-q", filePath]);
  if (ignored.exitCode === 0) process.exit(0);
} catch {}

const PATTERNS: { label: string; re: RegExp }[] = [
  { label: "OpenAI key", re: /\bsk-(?:proj-)?[A-Za-z0-9]{20,}\b/ },
  { label: "Anthropic key", re: /\bsk-ant-[A-Za-z0-9-]{20,}\b/ },
  { label: "GitHub token", re: /\bgh[posu]_[A-Za-z0-9]{30,}\b/ },
  { label: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: "Slack token", re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/ },
  { label: "private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  {
    label: "hardcoded credential assignment",
    re: /(?:api[_-]?key|secret|token|password|passwd)\s*[:=]\s*["'][A-Za-z0-9_\-]{12,}["']/i,
  },
];

let content = "";
try {
  content = await Bun.file(filePath).text();
} catch {
  process.exit(0);
}

const findings: string[] = [];
content.split("\n").forEach((line, i) => {
  for (const p of PATTERNS) {
    if (p.re.test(line)) {
      findings.push(`  ${i + 1}: [${p.label}] ${line.trim().slice(0, 120)}`);
      break;
    }
  }
});

if (findings.length === 0) process.exit(0);

process.stderr.write(`[SecretScanOnWrite] WARNING: possible secret(s) in ${filePath}\n`);
findings.slice(0, 8).forEach((f) => process.stderr.write(`${f}\n`));
process.stderr.write(
  "[SecretScanOnWrite] Move secrets to .env (gitignored) and read via process.env before committing.\n",
);
process.exit(2);
