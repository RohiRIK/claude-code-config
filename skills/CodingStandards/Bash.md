# Bash Standards

Bash is **last resort**. Prefer Bun/TypeScript for anything beyond ~50 lines of glue logic.

## Mandatory Header

Every script must start with:

```bash
#!/usr/bin/env bash
set -euo pipefail
```

| Flag | Effect |
|------|--------|
| `-e` | Exit immediately on any error |
| `-u` | Treat unset variables as errors |
| `-o pipefail` | Pipe failures propagate (not just last command) |

## Variables

- Quote ALL expansions: `"$var"` — never bare `$var` (prevents word splitting and glob expansion)
- Use `local` for all function-scoped variables
- Use `readonly` for constants: `readonly CONFIG_DIR="$HOME/.config"`

## Conditionals

- Always `[[ ]]` over `[ ]` — no word splitting, supports regex, safer
- Check command existence before use:

```bash
if ! command -v bun &>/dev/null; then
    echo "ERROR: bun is not installed." >&2
    exit 1
fi
```

## Functions

```bash
function do_thing() {
    local input="$1"
    local result
    result=$(process "$input") || {
        echo "ERROR: process failed for input '$input'" >&2
        return 1
    }
    echo "$result"
}
```

## When to Stop and Switch to TypeScript

Stop writing Bash and switch to a Bun CLI when:
- Logic exceeds ~50 lines
- You need JSON parsing
- You need HTTP requests
- You need structured error objects
- You need to be cross-platform

## Canonical Script Template

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
