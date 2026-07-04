import { readStdin } from "../lib/hookUtils.ts";

const raw = await readStdin();
const input = JSON.parse(raw || "{}");
const filePath: string = input?.tool_input?.file_path ?? "";

const isDocFile = /\.(md|txt)$/.test(filePath);
const isAllowed =
  /(README|CLAUDE|AGENTS|CONTRIBUTING|CHANGELOG|MEMORY|SKILL)\.md$/.test(filePath) ||
  /context-.*\.md$/.test(filePath) ||
  // Working/state directories where .md files are legitimate outputs:
  // Claude's persistent memory, plan/spec workflow docs, scratch space.
  /\/(docs|memory|plans|specs|tmp|scratchpad|Workflows|References)\//.test(filePath);

if (isDocFile && !isAllowed) {
  process.stderr.write("[Hook] BLOCKED: Unnecessary documentation file creation\n");
  process.stderr.write(`[Hook] File: ${filePath}\n`);
  process.stderr.write("[Hook] Use README.md for documentation instead\n");
  process.exit(1);
}

process.stdout.write(raw);
