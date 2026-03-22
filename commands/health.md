# /health — Project Health Score Dashboard

Show a ranked table of project health scores from the LTM API.

## Usage

```
/health
```

## What It Does

Calls `GET http://localhost:7331/api/health/projects` and prints a ranked table:

```
PROJECT HEALTH SCORES
─────────────────────────────────────────────────────────────
SCORE  STATUS           PROJECT              MEMORIES  STALE  CTX
─────────────────────────────────────────────────────────────
  85   🟢 healthy        claude-config            142      3   4/4
  62   🟡 needs_attention ai-soc-assistant          38     12   2/4
  31   🔴 neglected       portfolio-manager          9      9   0/4
─────────────────────────────────────────────────────────────
```

## Process

1. Fetch project health data:
   ```bash
   curl -s http://localhost:7331/api/health/projects
   ```

2. Parse the JSON and render a ranked table (highest score first).

3. For each project, show:
   - Score (0–100)
   - Status emoji: 🟢 healthy (≥70) · 🟡 needs_attention (40–69) · 🔴 neglected (<40)
   - Memory count, stale count, context item count
   - Last activity date if available

4. If the server is not running, print:
   ```
   LTM server is not running. Start it with: /ltm-server start
   ```

## Score Formula

| Metric | Weight | Source |
|--------|--------|--------|
| Memory Freshness (% accessed ≤30 days) | 35% | `memories.last_used_at` |
| Avg Confidence | 25% | `memories.confidence` |
| Context Coverage (goal/decision/gotcha/progress) | 20% | `context_items` |
| Session Activity (any access ≤14 days) | 20% | `memories.last_used_at` |
