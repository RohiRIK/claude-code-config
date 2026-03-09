# PowerShell Standards

Used for Azure administration, Entra ID management, and hybrid automation.

## Mandatory Script Header

Every script must open with:

```powershell
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$RequiredParam,
    [string]$OptionalParam = 'default'
)
$ErrorActionPreference = 'Stop'
```

## Output

| Use | Never Use |
|-----|-----------|
| `Write-Information` (operational progress) | `Write-Host` ❌ |
| `Write-Verbose` (debug detail) | |
| `Write-Warning` (non-fatal issues) | |
| `Write-Error` + `throw` (fatal) | |

`Write-Host` breaks pipeline compatibility and remoting. Never use it.

**Azure Automation runbooks:** Use `Write-Output` for job log output (it appears in the Azure portal job stream). This is the exception to the rule above — but be aware that `Write-Output` inside a function pollutes its return value when the caller does `$x = MyFunction`.

## Return Values

- Return objects, not strings — keep output pipeline-friendly
- Use `[PSCustomObject]@{}` to shape output

```powershell
return [PSCustomObject]@{
    Id      = $UserId
    Name    = $user.DisplayName
    Enabled = $user.AccountEnabled
}
```

## Boolean Parameters — CRITICAL

When passing `$true`/`$false` to cmdlet parameters, **always use the colon syntax**:

```powershell
# WRONG — PowerShell treats $false as a positional argument → "positional parameter cannot be found" error
Update-MgUser -UserId $id -AccountEnabled $false

# CORRECT
Update-MgUser -UserId $id -AccountEnabled:$false
```

This affects any cmdlet where the boolean param isn't the last positional param (common in Microsoft.Graph SDK).

## Security

- **Never `Invoke-Expression`** — evaluates arbitrary strings (RCE risk)
- Never store credentials in plain text — use `SecureString` or Azure Key Vault
- Validate all external input before use

## Error Handling

```powershell
try {
    $result = Get-MgUser -UserId $UserId
} catch {
    Write-Error "Failed to get user '$UserId': $_. Check permissions and the UserId format."
    throw
}
```

Always initialise variables that are set inside `try` blocks before the `try`, so they have a safe default if the `catch` branch runs:

```powershell
$LogMsg = "NO-OP"   # safe default
try {
    # ... $LogMsg = "SUCCESS: ..."
} catch {
    $LogMsg = "ERROR: $_"
}
return $LogMsg      # always defined
```

## Performance — Avoid `+=` in Loops

`+=` on arrays and strings creates a new object every iteration. For more than ~10 items this becomes slow.

```powershell
# SLOW — new array allocated every iteration
$results = @()
foreach ($item in $items) { $results += $item }

# FAST — use a List
$results = [System.Collections.Generic.List[object]]::new()
foreach ($item in $items) { $results.Add($item) }

# SLOW — new string allocated every iteration
$html = ""
foreach ($row in $rows) { $html += "<tr>$row</tr>" }

# FAST — use StringBuilder
$sb = [System.Text.StringBuilder]::new()
foreach ($row in $rows) { $null = $sb.Append("<tr>$row</tr>") }
$html = $sb.ToString()
```

## Graph API Pagination

Always follow `@odata.nextLink` for paginated results:

```powershell
$allItems = [System.Collections.Generic.List[object]]::new()
$uri = "https://graph.microsoft.com/v1.0/groups/$GroupId/members"
do {
    $response = Invoke-MgGraphRequest -Method GET -Uri $uri -ErrorAction Stop
    if ($response.value) { $allItems.AddRange([object[]]$response.value) }
    $uri = $response.'@odata.nextLink'
} while ($uri)
```

## Quality Gate

PSScriptAnalyzer must pass before any script is complete:
```powershell
Invoke-ScriptAnalyzer -Path ./script.ps1
```

## Pester Testing (v5)

### Setup pattern for scripts that use Microsoft.Graph

```powershell
Describe "My Script" {
    BeforeAll {
        # 1. Stub ALL external commands as global functions BEFORE dot-sourcing
        function global:Connect-MgGraph        { [CmdletBinding()] param([switch]$Identity, [switch]$NoWelcome) }
        function global:Get-MgContext          { [CmdletBinding()] param() }
        function global:Invoke-MgGraphRequest  { [CmdletBinding()] param($Method, $Uri, $Body, $ContentType) }
        function global:Get-MgUser             { [CmdletBinding()] param([switch]$All, $Filter, $Property) return @() }
        function global:Update-MgUser          { [CmdletBinding()] param($UserId, [bool]$AccountEnabled) }
        function global:Get-AutomationVariable { [CmdletBinding()] param($Name) return $null }

        # 2. Dot-source the script
        . $ScriptPath

        # 3. CRITICAL: Re-stub Write-Log AFTER dot-sourcing.
        #    The script's Write-Log uses Write-Output, which pollutes captured
        #    return values (e.g. $r = Get-InactiveUsers ...) with log strings.
        #    This override in the Describe scope shadows the dot-sourced version.
        function Write-Log { param($Message, $Level) }
    }

    It "mocks Graph calls correctly" {
        Mock Get-MgUser { return @([PSCustomObject]@{ Id = "u1" }) }
        # ... test logic
        Should -Invoke Get-MgUser -Times 1 -Exactly
    }
}
```

### Key gotchas

- **Microsoft.Graph.Users module** is likely installed (`Get-Command Get-MgUser` returns a real function). Define global stubs before dot-sourcing to shadow it.
- **Write-Log uses Write-Output** in runbooks — re-stub it AFTER dot-sourcing or all captured function return values will include log strings as extra items.
- **`[bool]` params** in function signatures: always pass with `-Param:$false` / `-Param:$true` from callers.
- **Mock in `It` blocks** in Pester v5 are scoped to the Describe level — they stack. Use `BeforeEach` for test isolation when multiple `It` blocks mock the same command.
- **`foreach ($x in $null)`** iterates once with `$x = $null` in PowerShell — always guard with `if ($null -eq $result) { return @() }` or return an empty collection from stubs.

## Context7

Use `use context7` for Microsoft.Graph module APIs — cmdlet signatures change between module versions.
