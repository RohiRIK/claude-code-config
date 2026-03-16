---
name: m365-agents-toolkit
description: "USE WHEN building Microsoft 365 agents, Teams apps, or Copilot extensions using the Agents Toolkit CLI."
user-invocable: true
---

# M365AgentsToolkit

Microsoft 365 Agents Toolkit CLI for building enterprise-ready agents and apps that work across Microsoft 365 Copilot, Teams, Outlook, and Office.

## Quick Start

1. **Install CLI**: `npm install -g @microsoft/m365agentstoolkit-cli`
2. **Check prerequisites**: `atk doctor`
3. **Create agent**: `atk new -c weather-agent -n myagent`
4. **Preview**: `atk preview`

## Available Commands

| Command | Description |
|---------|-------------|
| `atk doctor` | Prerequisite checker |
| `atk new` | Create new agent/app |
| `atk add` | Add features to app |
| `atk auth` | Manage M365/Azure accounts |
| `atk env` | Manage environments |
| `atk provision` | Provision cloud resources |
| `atk deploy` | Deploy to Azure |
| `atk package` | Build app package |
| `atk validate` | Validate app |
| `atk publish` | Publish to store |
| `atk preview` | Preview in Teams/Outlook |
| `atk install` | Upload to M365 |
| `atk collaborator` | Manage permissions |

## Common Workflows

### Create Weather Agent
```bash
atk new -c weather-agent -l typescript -n myagent -i false
```

### Preview in Teams
```bash
atk preview --env local
```

### Package and Publish
```bash
atk package --env dev
atk publish --env dev
```

## Reference Files

- `Installation-Npm.md` - Installation via npm
- `Installation-Bun.md` - Installation via bunx
- `CliCommands.md` - Detailed CLI reference
- `AgentTemplates.md` - Available agent templates
