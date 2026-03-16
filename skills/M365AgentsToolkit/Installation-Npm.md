# M365AgentsToolkit — Installation via npm

## Prerequisites

- Node.js 18+ 
- Microsoft 365 Developer Account
- Azure subscription (for deployment)

## Installation

```bash
npm install -g @microsoft/m365agentstoolkit-cli
```

## Verify Installation

```bash
atk --version
atk -h
```

## First Steps

1. **Check prerequisites**:
   ```bash
   atk doctor
   ```

2. **Login to Microsoft 365**:
   ```bash
   atk auth login
   ```

3. **List available templates**:
   ```bash
   atk list templates
   atk list samples
   ```

## Troubleshooting

### Permission Errors

If you get permission errors, try:
```bash
sudo npm install -g @microsoft/m365agentstoolkit-cli
```

### Command Not Found

Ensure npm global bin is in your PATH:
```bash
export PATH="$PATH:$(npm bin -g)"
```

### Update CLI

```bash
npm update -g @microsoft/m365agentstoolkit-cli
```

## Uninstall

```bash
npm uninstall -g @microsoft/m365agentstoolkit-cli
```
