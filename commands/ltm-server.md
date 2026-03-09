Start, stop, or check the LTM Graph visualization server.

Usage:
- `/ltm-server` — start if not running, open browser at http://localhost:7331
- `/ltm-server start` — start the server
- `/ltm-server stop` — stop the server
- `/ltm-server status` — show running state and URL

Route to the **LtmServer** skill for each action:
- `start` / no args → `skills/LtmServer/Workflows/Start.md`
- `stop` → `skills/LtmServer/Workflows/Stop.md`
- `status` → inline PID check from `skills/LtmServer/SKILL.md`

The server runs on port **7331** and auto-refreshes via WebSocket when `ltm.db` changes.
PID stored at `~/.claude/tmp/ltm-server.pid`.
