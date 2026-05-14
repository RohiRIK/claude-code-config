import { readStdin } from "../lib/hookUtils.ts";

const raw = await readStdin();
const input = JSON.parse(raw || "{}");
const cmd: string = input?.tool_input?.command ?? "";

if (/gh pr create/.test(cmd)) {
  const output: string = input?.tool_output?.output ?? "";
  const prMatch = output.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/);

  if (prMatch) {
    const prUrl = prMatch[0];
    const repo = prUrl.replace(/https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/\d+/, "$1");
    const prNum = prUrl.replace(/.*\/pull\/(\d+)/, "$1");
    process.stderr.write(`[Hook] PR created: ${prUrl}\n`);
    process.stderr.write("[Hook] Checking GitHub Actions status...\n");
    process.stderr.write(`[Hook] To review PR: gh pr review ${prNum} --repo ${repo}\n`);
  }
}

process.stdout.write(raw);
