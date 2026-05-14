import { readStdin } from "../lib/hookUtils.ts";

const raw = await readStdin();

if (!process.env.TMUX) {
  process.stderr.write("[Hook] Consider running in tmux for session persistence\n");
  process.stderr.write("[Hook] tmux new -s dev  |  tmux attach -t dev\n");
}

process.stdout.write(raw);
