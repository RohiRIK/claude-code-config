# M365AgentsToolkit — Authentication & Configuration

## Microsoft Entra ID Authentication

### Register App in Azure Portal

1. Go to **Microsoft Entra ID** > **App registrations**
2. Click **New registration**
3. Configure:
   - **Name**: Your agent name
   - **Supported account types**: Single tenant or Multitenant
   - **Redirect URI**: `https://localhost:3978/auth/callback`
4. Click **Register**
5. Note: Application (client) ID and Directory (tenant) ID
6. Go to **Certificates & secrets** > **New client secret**
7. Note the secret value

### Add API Permissions

1. Go to **API permissions** > **Add a permission**
2. Select **Microsoft Graph**
3. Add:
   - `User.Read` - Sign in and read user profile
   - `OnlineMeetings.ReadWrite` - For Teams meetings
   - `Calendars.ReadWrite` - For calendar access

### Configure Authentication in Code

```typescript
import { ConfigurationServiceFactory, AuthenticationConfiguration } from "microsoft/agents";

const authConfig: AuthenticationConfiguration = {
  clientId: process.env.M365_APP_CLIENT_ID,
  clientSecret: process.env.M365_APP_CLIENT_SECRET,
  tenantId: process.env.M365_APP_TENANT_ID,
  authorityHostUrl: "https://login.microsoftonline.com",
  scopes: ["User.Read", "OnlineMeetings.ReadWrite"]
};
```

## Environment Setup

### Local Development (.env.local)

```bash
# Microsoft 365 App Registration
M365_APP_CLIENT_ID=your-client-id
M365_APP_TENANT_ID=your-tenant-id
M365_APP_CLIENT_SECRET=your-client-secret

# Azure Resources
AZURE_SUBSCRIPTION_ID=your-subscription
AZURE_RESOURCE_GROUP=your-rg-name
AZURE_WEB_APP_NAME=your-app-name

# Optional: Bot Framework
BOT_ID=your-bot-id
BOT_PASSWORD=your-bot-password
```

### Production (.env.dev/prod)

Same as local but point to production Azure resources.

## Authentication Commands

### Login to Microsoft 365

```bash
atk auth login m365
```

### Login to Azure

```bash
atk auth login azure
```

### Check Auth Status

```bash
atk auth list
```

## Single Sign-On (SSO)

### Enable SSO for Declarative Agent

In `m365agents.yml`:

```yaml
provision:
  name: myagent
  sso:
    enabled: true
    appIdUri: "api://your-app-domain.com/your-client-id"
```

### SSO Consent Flow

1. User accesses agent in Teams
2. Microsoft handles authentication
3. Token automatically passed to your agent
4. Decode token in code:

```typescript
import { JwtTokenValidation } from "microsoft/agents";

async function handleSSO(context: TurnContext) {
  const token = context.activity.conversation.identity.token;
  const claims = await JwtTokenValidation.validateToken(
    token,
    process.env.M365_APP_CLIENT_ID
  );
  
  const userId = claims.oid;
  const userEmail = claims.preferred_username;
}
```

## OAuth for External Services

### Register External API

```typescript
// In your action definition
const weatherAction = {
  name: "getWeather",
  auth: {
    type: "OAuth2",
    provider: "weatherapi",
    clientId: process.env.WEATHER_API_KEY,
    clientSecret: process.env.WEATHER_API_SECRET,
    scopes: "read:weather"
  }
};
```

## Microsoft Graph API Access

### Common Graph Permissions

| Permission | Scope | Description |
|------------|-------|-------------|
| User.Read | `User.Read` | Read user profile |
| User.ReadBasic.All | `User.ReadBasic.All` | Read all users |
| Calendars.ReadWrite | `Calendars.ReadWrite` | Access calendar |
| Mail.Read | `Mail.Read` | Read emails |
| Files.ReadWrite | `Files.ReadWrite` | Access OneDrive/SharePoint |
| Team.ReadBasic.All | `Team.ReadBasic.All` | Read Teams |

### Using Graph in Actions

```typescript
import { Client } from "@microsoft/microsoft-graph-client";

const graphClient = Client.init({
  authProvider: async (done) => {
    const token = await getToken(); // Get from context
    done(null, token);
  }
});

// Get user profile
const me = await graphClient.api("/me").get();

// Get calendar
const events = await graphClient.api("/me/calendar/events").get();
```

## Troubleshooting Auth Issues

### Invalid Credentials

```
Error: AADSTS7000215: Invalid client secret
```

**Fix**: Regenerate client secret in Azure Portal.

### Insufficient Permissions

```
Error: 403 Forbidden - Insufficient privileges
```

**Fix**: Add required API permissions and grant admin consent.

### Token Expired

```
Error: AADSTS50013: Token expired
```

**Fix**: Refresh token or re-authenticate with `atk auth login`.
