#!/usr/bin/env bash
# setup.sh — Install the Claude Code LTM memory system into ~/.claude/
# Safe to re-run (idempotent).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
MEMORY_DIR="$CLAUDE_DIR/memory"
HOOKS_DIR="$CLAUDE_DIR/hooks"
COMMANDS_DIR="$CLAUDE_DIR/commands"
PROJECTS_DIR="$CLAUDE_DIR/projects"
TMP_DIR="$CLAUDE_DIR/tmp"

echo "=== Claude Code LTM Setup ==="
echo "Repo:   $REPO_DIR"
echo "Target: $CLAUDE_DIR"
echo ""

# --- 1. Create directories ---
echo "[1/6] Creating directories..."
mkdir -p "$MEMORY_DIR" "$HOOKS_DIR/lib" "$COMMANDS_DIR" "$PROJECTS_DIR" "$TMP_DIR"

# --- 2. Copy memory system (core DB files) ---
echo "[2/6] Installing memory system..."
for f in schema.sql shared-db.ts db.ts context.ts dedup.ts; do
  cp "$REPO_DIR/memory/$f" "$MEMORY_DIR/$f"
done

# Copy janitor if it exists
if [ -d "$REPO_DIR/memory/janitor" ]; then
  mkdir -p "$MEMORY_DIR/janitor/providers"
  cp "$REPO_DIR/memory/janitor/"*.ts "$MEMORY_DIR/janitor/" 2>/dev/null || true
  cp "$REPO_DIR/memory/janitor/providers/"*.ts "$MEMORY_DIR/janitor/providers/" 2>/dev/null || true
fi

# Copy package.json for memory if exists
[ -f "$REPO_DIR/memory/package.json" ] && cp "$REPO_DIR/memory/package.json" "$MEMORY_DIR/package.json"

# Copy server (optional, for Graph UI)
[ -f "$REPO_DIR/memory/server.ts" ] && cp "$REPO_DIR/memory/server.ts" "$MEMORY_DIR/server.ts"

echo "  ✓ Memory system installed"

# --- 3. Copy hooks ---
echo "[3/6] Installing hooks..."

# Shared hook library
cp "$REPO_DIR/hooks/lib/resolveProject.ts" "$HOOKS_DIR/lib/resolveProject.ts"
cp "$REPO_DIR/hooks/lib/hookUtils.ts" "$HOOKS_DIR/lib/hookUtils.ts"

# Copy hook tsconfig/package.json if they exist
[ -f "$REPO_DIR/hooks/tsconfig.json" ] && cp "$REPO_DIR/hooks/tsconfig.json" "$HOOKS_DIR/tsconfig.json"
[ -f "$REPO_DIR/hooks/package.json" ] && cp "$REPO_DIR/hooks/package.json" "$HOOKS_DIR/package.json"

# Individual hooks
for hook_dir in SessionStart PreCompact UpdateContext EvaluateSession Cleanup SuggestCompact SessionAutoName NotifyLtmServer SkillGuard; do
  if [ -d "$REPO_DIR/hooks/$hook_dir" ]; then
    mkdir -p "$HOOKS_DIR/$hook_dir"
    cp "$REPO_DIR/hooks/$hook_dir/"*.ts "$HOOKS_DIR/$hook_dir/" 2>/dev/null || true
    [ -f "$REPO_DIR/hooks/$hook_dir/README.md" ] && cp "$REPO_DIR/hooks/$hook_dir/README.md" "$HOOKS_DIR/$hook_dir/" || true
  fi
done

echo "  ✓ Hooks installed"

# --- 4. Copy slash commands ---
echo "[4/6] Installing commands..."
cp "$REPO_DIR/commands/"*.md "$COMMANDS_DIR/" 2>/dev/null || true
echo "  ✓ Commands installed"

# --- 5. Initialize DB ---
echo "[5/6] Initializing database..."
if [ -f "$MEMORY_DIR/schema.sql" ]; then
  # Use bun to create the DB via shared-db.ts (which runs schema + migrations)
  bun -e "
    const { getDb } = require('$MEMORY_DIR/shared-db.ts');
    const db = getDb();
    const tables = db.query(\"SELECT name FROM sqlite_master WHERE type='table'\").all();
    console.log('  Tables created:', tables.map(t => t.name).join(', '));
    console.log('  DB path: $MEMORY_DIR/ltm.db');
  " 2>/dev/null || {
    # Fallback: use sqlite3 directly
    if command -v sqlite3 &>/dev/null; then
      sqlite3 "$MEMORY_DIR/ltm.db" < "$MEMORY_DIR/schema.sql"
      echo "  ✓ DB initialized via sqlite3"
    else
      echo "  ⚠ Could not initialize DB (no bun:sqlite or sqlite3)"
    fi
  }
fi
echo "  ✓ Database ready"

# --- 6. Generate settings.json with correct paths ---
echo "[6/6] Configuring hooks in settings.json..."

# We'll write a helper that merges our hooks into the existing settings.json
bun -e "
import { readFileSync, writeFileSync, existsSync } from 'fs';

const SETTINGS_PATH = '$CLAUDE_DIR/settings.json';
const HOME = '$HOME';

// Read existing settings
let settings = {};
if (existsSync(SETTINGS_PATH)) {
  try { settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8')); } catch {}
}

// Preserve existing permissions
const existingPermissions = settings.permissions || {};

// Build hooks config with correct paths
const hooksDir = HOME + '/.claude/hooks';

settings.hooks = {
  PreToolUse: [
    {
      matcher: 'tool == \"Skill\"',
      hooks: [{ type: 'command', command: 'bun ' + hooksDir + '/SkillGuard/SkillGuard.ts' }]
    },
    {
      matcher: 'tool == \"Bash\" && tool_input.command matches \"(npm run dev|pnpm( run)? dev|yarn dev|bun run dev)\"',
      hooks: [{ type: 'command', command: '#!/bin/bash\ninput=\$(cat)\necho \"[Hook] BLOCKED: Dev server must run in tmux\" >&2\necho \"[Hook] Use: tmux new-session -d -s dev \\\"npm run dev\\\"\" >&2\nexit 1' }]
    },
    {
      matcher: 'tool == \"Edit\" || tool == \"Write\"',
      hooks: [{ type: 'command', command: 'bun ' + hooksDir + '/SuggestCompact/SuggestCompact.ts' }]
    }
  ],
  PreCompact: [
    {
      matcher: '*',
      hooks: [{ type: 'command', command: 'bun ' + hooksDir + '/PreCompact/PreCompact.ts' }]
    }
  ],
  UserPromptSubmit: [
    {
      matcher: '*',
      hooks: [{ type: 'command', command: 'bun ' + hooksDir + '/SessionAutoName/SessionAutoName.ts' }]
    }
  ],
  SessionStart: [
    {
      matcher: '*',
      hooks: [{ type: 'command', command: 'bun ' + hooksDir + '/SessionStart/SessionStart.ts' }]
    }
  ],
  PostToolUse: [
    {
      matcher: 'tool == \"Edit\" || tool == \"Write\"',
      hooks: [{ type: 'command', command: 'bun ' + hooksDir + '/NotifyLtmServer/NotifyLtmServer.ts' }]
    }
  ],
  Stop: [
    {
      matcher: '*',
      hooks: [{ type: 'command', command: 'bun ' + hooksDir + '/EvaluateSession/EvaluateSession.ts' }]
    },
    {
      matcher: '*',
      hooks: [{ type: 'command', command: 'bun ' + hooksDir + '/Cleanup/Cleanup.ts' }]
    },
    {
      matcher: '*',
      hooks: [{ type: 'command', command: 'bun ' + hooksDir + '/UpdateContext/UpdateContext.ts' }]
    }
  ]
};

// Restore permissions
settings.permissions = existingPermissions;

writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
console.log('  ✓ settings.json updated with hook paths using: ' + HOME);
"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "What's installed:"
echo "  • Memory DB:    $MEMORY_DIR/ltm.db"
echo "  • Hooks:        $HOOKS_DIR/{SessionStart,PreCompact,UpdateContext,...}"
echo "  • Commands:     $COMMANDS_DIR/{learn,recall,forget,...}.md"
echo ""
echo "What happens now:"
echo "  • SessionStart → injects project context at every new session"
echo "  • PreCompact   → saves context before /compact"
echo "  • EvaluateSession → extracts patterns at session end"
echo "  • UpdateContext → tracks progress automatically"
echo ""
echo "Manual commands:"
echo "  • /learn  → save an insight from current session"
echo "  • /recall → search past memories"
echo ""
echo "Optional (Graph UI):"
echo "  • bun ~/.claude/memory/server.ts &"
echo ""
