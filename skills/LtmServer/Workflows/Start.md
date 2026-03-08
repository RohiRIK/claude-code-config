# Start LTM Graph Server

Two modes: **dev** (HMR on :7332, API on :7331) or **prod** (API on :7331 serves built Next.js).

## Dev Mode (recommended for development)

1. **Start API server (port 7331)**

```bash
PID_FILE="$HOME/.claude/tmp/ltm-server.pid"
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "API already running (PID $PID)"
  else
    mkdir -p "$HOME/.claude/tmp"
    nohup bun "$HOME/.claude/memory/server.ts" \
      > "$HOME/.claude/tmp/ltm-server.log" 2>&1 &
    echo $! > "$HOME/.claude/tmp/ltm-server.pid"
    sleep 0.5
    echo "API started on http://localhost:7331"
  fi
else
  mkdir -p "$HOME/.claude/tmp"
  nohup bun "$HOME/.claude/memory/server.ts" \
    > "$HOME/.claude/tmp/ltm-server.log" 2>&1 &
  echo $! > "$HOME/.claude/tmp/ltm-server.pid"
  sleep 0.5
  echo "API started on http://localhost:7331"
fi
```

2. **Start Next.js dev server (port 7332, HMR enabled)**

Run in tmux or a new terminal:

```bash
cd "$HOME/.claude/memory/graph-app"
NEXT_PUBLIC_WS_URL=ws://localhost:7331 bun dev --port 7332
```

3. **Open browser**

```bash
open "http://localhost:7332"
```

## Prod Mode

1. **Build Next.js app**

```bash
cd "$HOME/.claude/memory/graph-app"
bun run build
```

2. **Start API server**

```bash
PID_FILE="$HOME/.claude/tmp/ltm-server.pid"
mkdir -p "$HOME/.claude/tmp"
nohup bun "$HOME/.claude/memory/server.ts" \
  > "$HOME/.claude/tmp/ltm-server.log" 2>&1 &
echo $! > "$HOME/.claude/tmp/ltm-server.pid"
sleep 0.5
```

3. **Open browser** (static HTML served from :7331, or run Next.js on :7332)

```bash
open "http://localhost:7331"
```

## Notes

- API + WebSocket always on `:7331`
- Next.js dev always on `:7332` with `/api/*` proxied to `:7331`
- `NEXT_PUBLIC_WS_URL=ws://localhost:7331` — WebSocket always connects to API server
