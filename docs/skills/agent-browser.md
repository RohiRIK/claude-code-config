# agent-browser

**Skill:** Browser automation CLI for AI agents.

**Description:** Browser automation CLI for AI agents. USE WHEN user needs to interact with websites, navigate pages, fill forms, click buttons, take screenshots, extract data, or automate any browser task.

---

## Overview

The agent-browser skill provides browser automation capabilities using Playwright.

## Core Workflow

1. **Navigate**: `agent-browser open <url>`
2. **Snapshot**: `agent-browser snapshot -i` (get element refs)
3. **Interact**: Use refs to click, fill, select
4. **Re-snapshot**: After DOM changes

## Essential Commands

```bash
# Navigation
agent-browser open <url>           # Navigate
agent-browser close                 # Close browser

# Snapshot
agent-browser snapshot -i           # Interactive elements with refs
agent-browser snapshot -s "#selector"  # Scope to selector

# Interaction
agent-browser click @e1             # Click element
agent-browser fill @e2 "text"       # Fill input
agent-browser select @e1 "option"   # Select dropdown
agent-browser scroll down 500      # Scroll

# Get information
agent-browser get text @e1          # Get element text
agent-browser get url              # Current URL
agent-browser get title            # Page title

# Wait
agent-browser wait @e1              # Wait for element
agent-browser wait --load networkidle
agent-browser wait --url "**/page"

# Capture
agent-browser screenshot           # Screenshot
agent-browser screenshot --full    # Full page
```

## Common Patterns

### Form Submission
```bash
agent-browser open https://example.com/form
agent-browser snapshot -i
agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password"
agent-browser click @e3
agent-browser wait --load networkidle
```

### Authentication
```bash
agent-browser open https://app.example.com/login
# ... login flow ...
agent-browser state save auth.json

# Later - reuse state
agent-browser state load auth.json
agent-browser open https://app.example.com/dashboard
```

### Session Persistence
```bash
agent-browser --session-name myapp open https://app.example.com
# ... actions ...
agent-browser close  # State auto-saved

# Next time - auto-loaded
agent-browser --session-name myapp open https://app.example.com/dashboard
```

## iOS Simulator

```bash
agent-browser device list
agent-browser -p ios --device "iPhone 16 Pro" open https://example.com
agent-browser -p ios snapshot -i
agent-browser -p ios tap @e1
agent-browser -p ios screenshot mobile.png
agent-browser -p ios close
```

## Ref Lifecycle

**Important:** Refs (`@e1`, `@e2`) are invalidated when page changes.

Always re-snapshot after:
- Clicking navigation links
- Form submissions
- Dynamic content loading

## Semantic Locators

```bash
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "user@test.com"
agent-browser find role button click --name "Submit"
agent-browser find testid "submit-btn" click
```

## Related

- **Used by:** [e2e-runner agent](../agents/e2e-runner.md)
- **See also:** [Goose skill](goose.md)

---

*Documentation generated from `skills/agent-browser/SKILL.md` - Last updated: 2026-02-25*
