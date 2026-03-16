# M365AgentsToolkit — Deployment Guide

## Deployment Workflow

```
1. Local Development → atk preview
2. Provision Resources → atk provision
3. Deploy to Azure → atk deploy
4. Package App → atk package
5. Validate → atk validate
6. Publish → atk publish
```

## Step 1: Local Development

### Start Local Server

```bash
# Option A: Auto-detect (npm run dev:atk)
atk preview --env local

# Option B: Specify command
atk preview --env local --run-command "npm run dev:atk"

# Option C: For .NET projects
atk preview --env local --run-command "dotnet run"
```

### Preview in Different Hosts

```bash
# Teams
atk preview --env local --m365-host teams

# Outlook
atk preview --env local --m365-host outlook

# Office
atk preview --env local --m365-host office
```

### Desktop Client

```bash
# Open in Teams desktop app
atk preview --env local --desktop
```

## Step 2: Provision Resources

### What Gets Provisioned

- Azure Web App
- Azure Bot Registration
- Microsoft Entra App Registration
- App in Microsoft 365

### Provision Commands

```bash
# Provision default environment
atk provision

# Provision specific environment
atk provision --env dev

# Skip loading .env file
atk provision --ignore-env-file
```

### Verify Provisioning

```bash
# Check Azure resources in portal
# Check app registration in Microsoft Entra ID
```

## Step 3: Deploy to Azure

### Deploy Commands

```bash
# Deploy to dev environment
atk deploy --env dev

# Deploy with custom config
atk deploy --env dev --config-file-path m365agents.yml

# Deploy all environments
atk deploy --env dev
atk deploy --env staging
atk deploy --env prod
```

### Azure Configuration in m365agents.yml

```yaml
deploy:
  - uses: azure-web-app/deploy
    with:
      artifact: ./dist
      runtime: nodejs-18
      region: eastus
      sku: B1
      httpsEnabled: true

  - uses: azure-storage/deploy
    with:
      connectionString: {{connectionString}}
```

## Step 4: Package App

### Package Commands

```bash
# Package for specific environment
atk package --env dev

# Custom output location
atk package --env dev --output-package-file ./dist/app.zip
```

### Package Contents

The generated `.zip` contains:
- `manifest.json` - App manifest with environment variables replaced
- Icons (color.png, outline.png)
- Any configured assets

## Step 5: Validate

### Validation Methods

```bash
# Validate against schema
atk validate --env dev --validate-method validation-rules

# Validate with test cases
atk validate --env dev --validate-method test-cases
```

### Common Validation Issues

| Error | Fix |
|-------|-----|
| Manifest schema invalid | Check manifest.json syntax |
| Icon size wrong | Use 192x192 and 32x32 PNG |
| Missing permissions | Add to manifest.json |
| Capability not supported | Check M365 host compatibility |

## Step 6: Publish

### Publish Commands

```bash
# Publish to organization catalog
atk publish --env dev

# Publish to Microsoft Store (requires approval)
atk publish --env prod
```

### Publishing Options

| Target | Command | Requirements |
|--------|---------|--------------|
| Organization Catalog | `atk publish --env dev` | M365 admin access |
| Microsoft Store | `atk publish --env prod` | Partner Center account |
| Side-load | `atk install` | Developer tenant |

## Environment Strategy

### Multiple Environments

```bash
# Create new environment
atk env add staging --env dev

# Deploy to staging
atk provision --env staging
atk deploy --env staging

# Test staging
atk preview --env staging
```

### Environment Files

```
env/
├── .env.local      # Local development
├── .env.dev        # Development
├── .env.staging    # Staging
└── .env.prod       # Production
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy M365 Agent

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Provision
        run: npx atk provision --env dev
      
      - name: Deploy
        run: npx atk deploy --env dev
      
      - name: Package
        run: npx atk package --env dev
      
      - name: Publish
        run: npx atk publish --env dev
        env:
          M365_APP_CLIENT_ID: ${{ secrets.M365_APP_CLIENT_ID }}
          M365_APP_CLIENT_SECRET: ${{ secrets.M365_APP_CLIENT_SECRET }}
```

### Azure DevOps

```yaml
- task: Npm@1
  inputs:
    command: 'install'
    workingDirectory: '$(Build.SourcesDirectory)'

- task: Npm@1
  inputs:
    command: 'custom'
    customCommand: 'run build'

- script: |
    npx atk provision --env dev
    npx atk deploy --env dev
    npx atk package --env dev
    npx atk publish --env dev
  env:
    M365_APP_CLIENT_ID: $(M365_APP_CLIENT_ID)
    M365_APP_CLIENT_SECRET: $(M365_APP_CLIENT_SECRET)
```

## Troubleshooting Deployment

### Resource Not Found

```
Error: Resource group not found
```

**Fix**: Run `atk provision` first to create resources.

### Authentication Failed

```
Error: Failed to acquire token
```

**Fix**: Run `atk auth login` to re-authenticate.

### Deployment Timeout

```
Error: Deployment timeout
```

**Fix**: Increase timeout in Azure or split deployment into smaller steps.
