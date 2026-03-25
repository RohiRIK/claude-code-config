# Microsoft 365 Admin PowerShell Reference

Complete reference for M365 admin scripting: Microsoft Graph, Exchange Online, Teams, SharePoint (PnP).

---

## Microsoft.Graph PowerShell SDK

**Replaces:** Azure AD PowerShell + MSOnline (both deprecated — migrate all existing scripts)

```powershell
# Install
Install-Module -Name Microsoft.Graph -Scope CurrentUser

# Connect (interactive, MFA-capable)
Connect-MgGraph -Scopes "User.Read.All", "Group.Read.All"

# Connect (app-only / automation)
Connect-MgGraph -TenantId $tenantId -ClientId $appId -CertificateThumbprint $thumb
```

**Docs:** https://learn.microsoft.com/en-us/powershell/microsoftgraph/overview
**SDK GitHub:** https://github.com/microsoftgraph/msgraph-sdk-powershell

### Key cmdlets

| Task | Cmdlet |
|------|--------|
| Get all users | `Get-MgUser -All` |
| Get user by UPN | `Get-MgUser -UserId user@domain.com` |
| Filter users | `Get-MgUser -Filter "accountEnabled eq false"` |
| Update user | `Update-MgUser -UserId $id -AccountEnabled:$false` |
| Get groups | `Get-MgGroup -All` |
| Get group members | `Get-MgGroupMember -GroupId $gid` |
| Get devices | `Get-MgDevice -All` |
| Assign license | `Set-MgUserLicense -UserId $id -AddLicenses @{SkuId=$sku} -RemoveLicenses @()` |

### Pagination — always use `-All` or follow nextLink

```powershell
# SDK handles pagination automatically with -All
$allUsers = Get-MgUser -All -Select "id,displayName,accountEnabled"

# Manual pagination via Invoke-MgGraphRequest
$uri = "https://graph.microsoft.com/v1.0/users?`$top=999&`$select=id,displayName"
$allUsers = [System.Collections.Generic.List[object]]::new()
do {
    $resp = Invoke-MgGraphRequest -Method GET -Uri $uri
    if ($resp.value) { $allUsers.AddRange([object[]]$resp.value) }
    $uri = $resp.'@odata.nextLink'
} while ($uri)
```

### Gotchas

- **Boolean params:** Always use colon syntax → `-AccountEnabled:$false` (not `-AccountEnabled $false`)
- **Permissions:** Scopes are not pre-authorized — first run prompts admin consent
- **Beta endpoint:** `Connect-MgGraph` then use `Invoke-MgGraphRequest -Uri "https://graph.microsoft.com/beta/..."` — no SLA, breaking changes possible
- **Select properties:** Always use `-Select` in bulk ops — default returns all props and is slow
- **Throttling:** Graph throttles at ~10k requests/10min per app. Add `Start-Sleep -Milliseconds 100` in large loops

---

## Microsoft Graph REST API (direct)

Use when the PS SDK doesn't expose a cmdlet, or for precision control.

**Base URL (production):** `https://graph.microsoft.com/v1.0/`
**Beta:** `https://graph.microsoft.com/beta/`
**Docs:** https://learn.microsoft.com/en-us/graph/api/overview

```powershell
# Get token via managed identity (Azure Automation / runbook)
$tokenResp = Invoke-RestMethod -Uri "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://graph.microsoft.com" -Headers @{Metadata="true"}
$headers = @{ Authorization = "Bearer $($tokenResp.access_token)" }

# Or use Connect-MgGraph then Invoke-MgGraphRequest (handles auth automatically)
$resp = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/users?`$filter=accountEnabled eq false&`$select=id,displayName,userPrincipalName"
```

### Common OData query patterns

```powershell
# Filter
"?`$filter=accountEnabled eq false"
"?`$filter=startsWith(userPrincipalName,'admin')"
"?`$filter=assignedLicenses/`$count ne 0"

# Select specific properties
"?`$select=id,displayName,userPrincipalName,accountEnabled"

# Expand related entity
"?`$expand=memberOf"

# Order + top
"?`$orderby=displayName&`$top=100"

# Count
"?`$count=true" # requires ConsistencyLevel: eventual header
```

---

## Exchange Online PowerShell (v3)

**No more Basic auth / WinRM** — v3 uses REST API (since 2023).

```powershell
# Install
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser

# Connect (interactive)
Connect-ExchangeOnline -UserPrincipalName admin@domain.com

# Connect (app-only / certificate)
Connect-ExchangeOnline -AppId $appId -CertificateThumbprint $thumb -Organization domain.onmicrosoft.com

# Disconnect
Disconnect-ExchangeOnline -Confirm:$false
```

**Docs:** https://learn.microsoft.com/en-us/powershell/exchange/exchange-online-powershell-v2

### Key cmdlets

| Task | Cmdlet | Note |
|------|--------|------|
| Get all mailboxes | `Get-EXOMailbox -ResultSize Unlimited` | Use `Get-EXO*` variants — faster |
| Get mailbox stats | `Get-EXOMailboxStatistics -Identity $upn` | |
| Set mailbox | `Set-Mailbox -Identity $upn -HiddenFromAddressListsEnabled $true` | Legacy but still needed |
| Message trace | `Get-MessageTrace -SenderAddress $from -StartDate $start -EndDate $end` | Max 10 days |
| Get recipients | `Get-EXORecipient -ResultSize Unlimited` | All mail-enabled objects |
| Shared mailbox perms | `Add-MailboxPermission -Identity $mbx -User $user -AccessRights FullAccess` | |
| Forward mail | `Set-Mailbox -Identity $upn -ForwardingSmtpAddress $fwd -DeliverToMailboxAndForward $true` | |

### Gotchas

- **`Get-EXO*` vs `Get-*`:** Always prefer `Get-EXOMailbox` over `Get-Mailbox` for performance. Use `-PropertySets Minimum` for bulk ops.
- **`-ResultSize Unlimited`:** Required — default is 1000
- **Message trace limit:** Max 10-day window; for older data use `Start-HistoricalSearch`
- **App-only auth:** Requires `Exchange.ManageAsApp` API permission + Exchange admin role assignment

---

## Microsoft Teams PowerShell

```powershell
# Install
Install-Module -Name MicrosoftTeams -Scope CurrentUser

# Connect
Connect-MicrosoftTeams

# Disconnect
Disconnect-MicrosoftTeams
```

**Docs:** https://learn.microsoft.com/en-us/powershell/module/teams

### Key cmdlets

| Task | Cmdlet |
|------|--------|
| Get all teams | `Get-Team` |
| Get team members | `Get-TeamUser -GroupId $gid` |
| Add team member | `Add-TeamUser -GroupId $gid -User $upn` |
| Meeting policies | `Get-CsTeamsMeetingPolicy` / `Set-CsTeamsMeetingPolicy` |
| External access | `Set-CsTenantFederationConfiguration` |
| Guest settings | `Set-CsTeamsGuestMeetingConfiguration` |

---

## PnP PowerShell (SharePoint Online + M365)

**Breaking change (Sept 2024):** The shared multi-tenant PnP Management Shell Entra app was deleted. You **must** register your own Entra app — there is no fallback.
See: https://github.com/pnp/powershell/discussions/4249

```powershell
# Install
Install-Module -Name PnP.PowerShell -Scope CurrentUser

# Register your own Entra app (one-time)
Register-PnPManagementShellAccess   # Opens browser for admin consent

# Connect to SharePoint
Connect-PnPOnline -Url "https://tenant.sharepoint.com/sites/MySite" -Interactive

# Connect app-only
Connect-PnPOnline -Url $url -ClientId $appId -Tenant $tenantId -CertificatePath ./cert.pfx
```

**Docs:** https://pnp.github.io/powershell/
**GitHub:** https://github.com/pnp/powershell

### Key cmdlets

| Task | Cmdlet |
|------|--------|
| List all sites | `Get-PnPTenantSite` |
| Get site users | `Get-PnPUser` |
| Set site permissions | `Set-PnPSite -Identity $url -Owners $owners` |
| Get lists | `Get-PnPList` |
| Get list items | `Get-PnPListItem -List "Documents"` |
| Manage Teams via PnP | `Get-PnPTeamsTeam`, `Add-PnPTeamsUser` |

---

## Cross-Module: Common Admin Patterns

### Bulk user operation with Graph + EXO

```powershell
# Get disabled users from Graph, check mailbox in EXO
Connect-MgGraph -Scopes "User.Read.All"
Connect-ExchangeOnline -UserPrincipalName admin@domain.com

$disabledUsers = Get-MgUser -Filter "accountEnabled eq false" -All -Select "id,userPrincipalName,displayName"

foreach ($user in $disabledUsers) {
    $mbx = Get-EXOMailbox -Identity $user.UserPrincipalName -ErrorAction SilentlyContinue
    if ($mbx) {
        Write-Information "Disabled user has mailbox: $($user.UserPrincipalName)"
    }
}
```

### Module versions — always pin in runbooks

```powershell
# Check installed versions
Get-Module -ListAvailable Microsoft.Graph, ExchangeOnlineManagement, MicrosoftTeams, PnP.PowerShell | Select Name, Version

# Install specific version
Install-Module Microsoft.Graph -RequiredVersion 2.x.x -Scope CurrentUser
```

### Least-privilege scope reference

| Operation | Minimum scope |
|-----------|--------------|
| Read users | `User.Read.All` |
| Write users | `User.ReadWrite.All` |
| Read groups | `Group.Read.All` |
| Assign licenses | `Organization.ReadWrite.All` |
| Read audit logs | `AuditLog.Read.All` |
| Read mail | `Mail.Read` |
| Read directory | `Directory.Read.All` |
