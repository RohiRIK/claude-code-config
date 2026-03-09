---
name: LtmServer
description: Start, stop, and check status of the LTM graph visualization server at
  http://localhost:7331. USE WHEN starting or stopping the graph UI, checking server
  status, or opening the memory graph browser.
version: 1.0.0
---

# LTM Graph Server

Obsidian-style force graph at **http://localhost:7331** visualizing `ltm.db`.

## Quick Reference

| Detail | Value |
|--------|-------|
| Port | 7331 |
| PID file | `~/.claude/tmp/ltm-server.pid` |
| Log file | `~/.claude/tmp/ltm-server.log` |
| Server | `~/.claude/memory/server.ts` |
| UI | `~/.claude/memory/graph-ui/index.html` |

## Routing

| User says | Action |
|-----------|--------|
| start / open / launch | → `Workflows/Start.md` |
| stop / kill / close | → `Workflows/Stop.md` |
| status / running? | Check PID file, report URL or "not running" |

## Status Check (inline)

```bash
PID_FILE="$HOME/.claude/tmp/ltm-server.pid"
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "Running — PID $PID — http://localhost:7331"
  else
    echo "Not running (stale PID file)"
  fi
else
  echo "Not running"
fi
```
