# Bash Starter Templates

Curated templates for Bash scripts. Remember: Bash is last resort (~50 lines max — switch to TypeScript/Bun beyond that).

| Template | Repo | Use When |
|---|---|---|
| Bash script template | [nicowillis/bash-script-template](https://github.com/nicowillis/bash-script-template) | General-purpose script with logging, error handling |
| Comprehensive template | [ralish/bash-script-template](https://github.com/ralish/bash-script-template) | Feature-rich template with colour output, locking, cron support |
| Canonical inline scaffold | See below | Quick glue scripts under 50 lines |

## Quickstart — Canonical Inline Scaffold

Copy this as your starting point (from `Bash.md`):

```bash
#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" >&2
}

function main() {
    local target="${1:?Usage: $0 <target>}"
    log "Starting with target: $target"
    # logic here
}

main "$@"
```

## Decision Rule

If you need JSON parsing, HTTP requests, or logic > 50 lines → stop and use TypeScript/Bun instead.
