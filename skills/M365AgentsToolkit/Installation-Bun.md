# M365AgentsToolkit — Installation via Bun

## Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 18+ (required by the package)
- Microsoft 365 Developer Account
- Azure subscription (for deployment)

## Installation

### Option 1: Using bunx (Recommended)

```bash
# Run directly without installation
bunx @microsoft/m365agentstoolkit-cli atk -h
```

### Option 2: Install globally via npm (then use with bun)

```bash
npm install -g @microsoft/m365agentstoolkit-cli
# Use atk command directly
atk -h
```

### Option 3: Create alias in .bashrc/.zshrc

```bash
# Add to your shell config
alias atk="bunx @microsoft/m365agentstoolkit-cli"
```

Then reload shell:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

Now use:
```bash
atk -h
atk doctor
```

## Verify Installation

```bash
# Option A: Direct bunx
bunx @microsoft/m365agentstoolkit-cli --version

# Option B: If npm-installed
atk --version
```

## First Steps

1. **Check prerequisites**:
   ```bash
   bunx @microsoft/m365agentstoolkit-cli atk doctor
   ```

2. **Login to Microsoft 365**:
   ```bash
   bunx @microsoft/m365agentstoolkit-cli atk auth login
   ```

3. **List available templates**:
   ```bash
   bunx @microsoft/m365agentstoolkit-cli atk list templates
   ```

## Why bunx?

- No global installation needed
- Always uses latest version
- Works alongside npm-installed version
- Faster package resolution

## Notes

The `@microsoft/m365agentstoolkit-cli` package is an npm package and requires Node.js runtime. Bun can execute it via `bunx` which automatically downloads and runs the package.
