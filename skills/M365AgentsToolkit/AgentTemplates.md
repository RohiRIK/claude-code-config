# M365AgentsToolkit — Agent Templates

## Available Capabilities

Use with `atk new -c <capability>`

| Capability | Description | Language Support |
|------------|-------------|-----------------|
| `declarative-agent` | Declarative agent for Microsoft 365 Copilot | TypeScript, JavaScript |
| `basic-custom-engine-agent` | Custom engine agent with your own logic | TypeScript, JavaScript, C# |
| `weather-agent` | Sample weather agent | TypeScript, JavaScript |
| `notification` | Notification bot | TypeScript, JavaScript |

## Create from Templates

### Interactive Mode

```bash
atk new
```

### Non-Interactive Mode

```bash
# Create weather agent with TypeScript
atk new -c weather-agent -l typescript -n my-weather-agent -i false

# Create declarative agent
atk new -c declarative-agent -l typescript -n my-copilot-agent -i false

# Create custom engine agent
atk new -c basic-custom-engine-agent -l javascript -n my-agent -i false
```

## List Available Templates

```bash
# List all templates
atk list templates

# List all samples
atk list samples
```

## Template Structure

After creation, your project will have:

```
my-agent/
├── appPackage/
│   └── manifest.json
├── env/
│   ├── .env.local
│   └── .env.dev
├── src/
│   └── index.ts
├── m365agents.yml
├── package.json
└── README.md
```

## m365agents.yml Configuration

The `m365agents.yml` file defines provisioning and deployment:

```yaml
provision:
  name: my-agent
  resources:
    - name: web
      type: azure-web-app
      runtime: nodejs-18

deploy:
  - uses: azure-web-app/deploy
    with:
      artifact: ./dist
```

## Adding Capabilities

Add features to existing project:

```bash
# Add action (API endpoint)
atk add action

# Add authentication
atk add auth-config

# Add new capability
atk add capability
```
