# Stop LTM Graph Server

## Steps

1. **Read PID file**

```bash
PID_FILE="$HOME/.claude/tmp/ltm-server.pid"
if [ ! -f "$PID_FILE" ]; then
  echo "LTM server is not running (no PID file)"
  exit 0
fi
PID=$(cat "$PID_FILE")
```

2. **Kill process**

```bash
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Stopped LTM server (PID $PID)"
else
  echo "Process $PID was not running"
fi
```

3. **Cleanup**

```bash
rm -f "$HOME/.claude/tmp/ltm-server.pid"
rm -f "$HOME/.claude/tmp/ltm-server.log"
```

4. **Confirm**

```
LTM Graph server stopped.
```
