# M365AgentsToolkit — CLI Commands Reference

All commands use the `atk` prefix.

## Global Options

| Option | Shortcut | Description |
|--------|----------|-------------|
| `--version` | `-v` | Display version |
| `--help` | `-h` | Show help |
| `--interactive` | `-i` | Interactive mode (default: true) |
| `--debug` | | Print debug info |
| `--verbose` | | Print diagnostic info |
| `--telemetry` | | Enable telemetry (default: true) |

## Command: doctor

Check prerequisites for building Microsoft 365 Apps.

```bash
atk doctor
```

## Command: new

Create a new Microsoft 365 App or agent.

### Parameters

| Parameter | Shortcut | Required | Description |
|-----------|----------|----------|-------------|
| `--app-name` | `-n` | Yes | Name of your application |
| `--capability` | `-c` | Yes | App type: `declarative-agent`, `basic-custom-engine-agent`, `weather-agent` |
| `--programming-language` | `-l` | No | `javascript`, `typescript`, `csharp` (default: javascript) |
| `--folder` | `-f` | No | Directory to create project (default: ./) |

### Examples

```bash
# Interactive mode
atk new

# Non-interactive - create weather agent
atk new -c weather-agent -l typescript -n myagent -i false

# Non-interactive - create notification bot
atk new -c notification -t timer-functions -l typescript -n myapp -i false
```

## Command: add

Add features to existing app.

| Subcommand | Description |
|------------|-------------|
| `atk add spfx-web-part` | Add SPFx web part |
| `atk add action` | Add Copilot action |
| `atk add auth-config` | Add authentication |
| `atk add capability` | Add new capability |

## Command: auth

Manage Microsoft 365 and Azure accounts.

```bash
# List connected accounts
atk auth list

# Login
atk auth login

# Logout
atk auth logout m365
atk auth logout azure
```

## Command: env

Manage environments.

```bash
# Add new environment
atk env add staging --env dev

# List environments
atk env list

# Reset environment
atk env reset dev
```

## Command: provision

Provision cloud resources.

```bash
# Provision default environment
atk provision

# Provision specific environment
atk provision --env dev

# Provision local environment
atk provision --env local
```

## Command: deploy

Deploy application to Azure.

```bash
# Deploy to dev environment
atk deploy --env dev

# Deploy with custom config
atk deploy --env dev --config-file-path m365agents.yml
```

## Command: package

Build app package for publishing.

```bash
# Package for dev environment
atk package --env dev

# Custom output
atk package --env dev --output-package-file ./dist/app.zip
```

## Command: validate

Validate app manifest or package.

```bash
# Validate with validation rules
atk validate --env dev --validate-method validation-rules

# Validate with test cases
atk validate --env dev --validate-method test-cases
```

## Command: publish

Publish to Microsoft Store or organizational catalog.

```bash
atk publish --env dev
```

## Command: preview

Preview app in Teams, Outlook, or Microsoft 365.

### Parameters

| Parameter | Shortcut | Description |
|-----------|----------|-------------|
| `--m365-host` | `-m` | `teams`, `outlook`, `office` (default: teams) |
| `--env` | | Environment name (default: local) |
| `--run-command` | `-c` | Command to start local service |
| `--browser` | `-b` | `chrome`, `edge`, `default` |
| `--desktop` | `-d` | Open desktop client |
| `--open-only` | `-o` | Skip starting local service |

### Examples

```bash
# Local preview in Teams
atk preview --env local

# Preview in Outlook
atk preview --env local --m365-host outlook

# Open in desktop client
atk preview --env local --desktop

# Use specific browser
atk preview --env local --browser chrome
```

## Command: install

Upload app package to Microsoft 365.

```bash
# Install with JSON manifest
atk install --file-path appPackage.zip

# Install in Shared scope
atk install --file-path appPackage.zip --scope Shared

# Install Outlook add-in with XML manifest
atk install --xml-path manifest.xml
```

## Command: collaborator

Manage team collaboration.

```bash
# Check permissions
atk collaborator status

# Grant permission
atk collaborator grant --email colleague@company.com
```

## Command: uninstall

Clean up resources.

```bash
# By title ID
atk uninstall --mode title-id --title-id U_xxxxxxxx

# By manifest ID
atk uninstall --mode manifest-id --manifest-id xxxxxxxx

# By environment
atk uninstall --mode env --env dev
```

## Command: upgrade

Upgrade project to latest version.

```bash
# Interactive
atk upgrade

# Force upgrade
atk upgrade --force
```
