# PowerShell Starter Templates

Curated templates for scaffolding new PowerShell projects. PowerShell uses **Plaster** as its official scaffolding tool (equivalent to `cargo generate` for Rust).

| Template | Repo | Use When |
|---|---|---|
| PS Module (Plaster) | [PowerShellOrg/Plaster](https://github.com/PowerShellOrg/Plaster) | Publishable PSGallery module with Pester v5, PlatyPS docs, GitHub Actions |
| PS Module scaffold | [Sarafian/PowerShellTemplate](https://github.com/Sarafian/PowerShellTemplate) | Module template with Pester v5 + CI pre-wired |
| Azure Automation runbook | [prehor/azure-automation-runbook-template](https://github.com/prehor/azure-automation-runbook-template) | Runbook project with ARM deployment, "Use this template" button |
| Entra ID / Graph automation | [hrushikesh2k1/EntraId-Identity-Automation](https://github.com/hrushikesh2k1/EntraId-Identity-Automation) | User lifecycle automation (create/update/disable/delete) |
| Entra admin scripts | [ChrFrohn/Entra](https://github.com/ChrFrohn/Entra) | Collection of Entra ID administration script patterns |

## Quickstart — Plaster Module Scaffold

```powershell
# Install Plaster once
Install-Module -Name Plaster -Scope CurrentUser

# Scaffold a new module interactively
New-PlasterManifest -Path ./plaster.xml   # define your template
Invoke-Plaster -TemplatePath . -DestinationPath ./MyModule

# Or use a community template directly
git clone https://github.com/Sarafian/PowerShellTemplate MyModule
```

## Quickstart — Inline Script + Pester v5

For standalone scripts (not modules), use this layout:

```
MyProject/
  src/
    Invoke-MyTask.ps1
  tests/
    Invoke-MyTask.Tests.ps1
  .github/workflows/
    test.yml
```

```powershell
# src/Invoke-MyTask.ps1
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Target
)
$ErrorActionPreference = 'Stop'
# logic here

# tests/Invoke-MyTask.Tests.ps1
Describe "Invoke-MyTask" {
    BeforeAll {
        # Stub external commands BEFORE dot-sourcing
        function global:Get-MgUser { param($UserId) }
        . "$PSScriptRoot/../src/Invoke-MyTask.ps1"
    }
    It "processes target correctly" {
        # ...
    }
}

# Run
Invoke-Pester ./tests/ -Output Detailed
```

## Notes

- Always run `Invoke-ScriptAnalyzer -Path ./src/` before committing
- For Microsoft.Graph scripts: stub all `*-Mg*` commands globally before dot-sourcing (see `PowerShell.md` Pester section)
- GitHub Actions CI: use `actions/starter-workflows` — browse the Actions tab for PowerShell workflow suggestions

## M365 Admin Reference

For Microsoft Graph, Exchange Online, Teams, and SharePoint (PnP) scripting patterns, see:
→ `../M365Admin.md` — full module reference, auth patterns, key cmdlets, gotchas, least-privilege scopes
