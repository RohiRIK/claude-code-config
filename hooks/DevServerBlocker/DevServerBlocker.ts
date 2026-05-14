import { readStdin } from "../lib/hookUtils.ts";

await readStdin();

process.stderr.write("[Hook] BLOCKED: Dev server must run in tmux for log access\n");
process.stderr.write("[Hook] Use this command instead:\n");
process.stderr.write("[Hook] tmux new-session -d -s dev '<your-dev-command>'\n");
process.stderr.write("[Hook] Then: tmux attach -t dev\n");
process.exit(1);
