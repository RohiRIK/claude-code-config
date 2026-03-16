# M365AgentsToolkit — Common Scenarios

## Scenario 1: Weather Agent

### Create Weather Agent

```bash
# Create new weather agent
atk new -c weather-agent -l typescript -n weather-agent -i false

cd weather-agent
npm install
```

### Add Custom Weather Action

```typescript
// src/actions/weather.ts
import { ActionTurnContext, ActionHandler } from "microsoft/agents";

interface WeatherRequest {
  location: string;
  units?: "celsius" | "fahrenheit";
}

export const weatherAction: ActionHandler = async (
  context: ActionTurnContext,
  request: WeatherRequest
) => {
  const { location, units = "celsius" } = request;
  
  const response = await fetch(
    `https://api.weather.com/v3/wx/conditions/current?location=${encodeURIComponent(location)}&units=${units}`
  );
  
  const data = await response.json();
  
  return {
    location: data.location,
    temperature: data.temperature,
    conditions: data.conditions,
    humidity: data.humidity,
    windSpeed: data.windSpeed
  };
};
```

### Register Action

```typescript
// src/index.ts
import { weatherAction } from "./actions/weather";

const app = new ApplicationBuilder()
  .withStorage(new MemoryStorage())
  .withAdapter(adapter)
  .build();

app.ai.registerAction("getWeather", weatherAction);
```

### Test

```bash
atk preview --env local
```

## Scenario 2: Calendar Agent

### Create Project

```bash
atk new -c basic-custom-engine-agent -n calendar-agent -i false
cd calendar-agent
```

### Implement Calendar Actions

```typescript
// src/actions/calendar.ts
import { Client } from "@microsoft/microsoft-graph-client";

export async function createMeeting(
  graphClient: Client,
  subject: string,
  startTime: string,
  endTime: string,
  attendees: string[]
) {
  const meeting = {
    subject,
    start: { dateTime: startTime, timeZone: "UTC" },
    end: { dateTime: endTime, timeZone: "UTC" },
    attendees: attendees.map(email => ({
      emailAddress: { address: email },
      type: "required"
    })),
    lobbyBypassSettings: {
      scope: "organization",
      isDialInBypassEnabled: true
    }
  };

  return await graphClient.api("/me/onlineMeetings").post(meeting);
}
```

### Configure Graph Permissions

In `aad.manifest.json`:

```json
{
  "requiredResourceAccess": [
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        {
          "id": "7835712a-229e-4fad-9d93-6d174af50e02",
          "type": "Scope",
          "scope": "OnlineMeetings.ReadWrite"
        }
      ]
    }
  ]
}
```

## Scenario 3: File Processing Agent

### Create Agent

```bash
atk new -c declarative-agent -n file-agent -i false
```

### Implement File Processing

```typescript
// src/actions/files.ts
import { Client } from "@microsoft/microsoft-graph-client";

export async function processFile(
  graphClient: Client,
  fileId: string
): Promise<string> {
  // Download file
  const file = await graphClient.api(`/me/drive/items/${fileId}`).get();
  
  // Get file content
  const content = await graphClient.api(`/me/drive/items/${fileId}/content`).get();
  
  // Process content (example: extract text)
  const processed = await processContent(content);
  
  // Upload processed file
  const result = await graphClient
    .api("/me/drive/root:/processed/:content")
    .put(JSON.stringify(processed));
  
  return result.webUrl;
}

async function processContent(content: any): Promise<string> {
  // Add your processing logic here
  return `Processed: ${JSON.stringify(content)}`;
}
```

## Scenario 4: Teams Notification Bot

### Create Notification Bot

```bash
atk new -c notification -t timer-functions -n notification-bot -i false
```

### Implement Notification

```typescript
// src/notifications/timerTrigger.ts
import { NotificationTarget, TeamsAdapter } from "microsoft/agents";

const adapter = new TeamsAdapter();

export async function sendPeriodicNotification() {
  const target = new NotificationTarget();
  
  // Get users to notify
  const users = await getSubscribedUsers();
  
  for (const user of users) {
    await adapter.continueConversation(
      user.aadObjectId,
      async (context) => {
        const message = {
          type: "message",
          text: "Daily report is ready! Check your dashboard."
        };
        await context.sendActivity(message);
      }
    );
  }
}
```

## Scenario 5: Multi-Channel Agent

### Deploy to Teams + Outlook + Web

```typescript
// src/index.ts
import { CloudAdapter, ConfigurationServiceFactory } from "microsoft/agents";

const adapter = new CloudAdapter(ConfigurationServiceFactory.getConfiguration());

// Teams Channel
adapter.registerTarget("teams", {
  channelId: "teams",
  enableSuffix: true
});

// Outlook Channel
adapter.registerTarget("outlook", {
  channelId: "outlook",
  enableSuffix: true
});

// M365 App
adapter.registerTarget("m365", {
  channelId: "m365",
  enableSuffix: false
});
```

### Configure in manifest.json

```json
{
  "extensions": [
    {
      "requirements": {
        "capabilities": [
          {
            "name": "DeclarativeAgent",
            "id": "my-agent"
          }
        ]
      },
      "runtimes": [
        {
          "id": "main-runtime",
          "type": "OAUTH2",
          "entrypoint": "https://myapp.azurewebsites.net/api/agent",
          "capabilities": ["teams", "outlook", "m365"]
        }
      ]
    }
  ]
}
```

## Scenario 6: SSO Integration

### Configure SSO

```typescript
// src/index.ts
import { CloudAdapter, JwtTokenValidation } from "microsoft/agents";

const adapter = new CloudAdapter();

adapter.use(async (context, next) => {
  // Check for SSO token
  const token = context.activity.conversation.identity.token;
  
  if (token) {
    const claims = await JwtTokenValidation.validateToken(
      token,
      process.env.M365_APP_CLIENT_ID
    );
    
    // Store user info in conversation state
    context.turnState.set("userId", claims.oid);
    context.turnState.set("userEmail", claims.preferred_username);
  }
  
  await next();
});
```

### Use in Actions

```typescript
app.ai.do("getProfile", async (context) => {
  const userId = context.turnState.get("userId");
  
  const graphClient = createGraphClient(userId);
  const profile = await graphClient.api("/me").get();
  
  return profile;
});
```

## Scenario 7: Copilot Extension

### Create as Copilot Extension

```bash
atk new -c declarative-agent -n copilot-extension -i false
```

### Define in manifest

```json
{
  "extensions": [
    {
      "requirements": {
        "capabilities": [
          {
            "name": "DeclarativeCopilot",
            "id": "my-copilot"
          }
        ]
      },
      "name": "My Copilot Extension",
      "description": {
        "short": "Enterprise knowledge assistant"
      }
    }
  ]
}
```

### Register with Microsoft Copilot

```bash
# Package and publish
atk package --env dev
atk publish --env dev
```

Then install in Microsoft 365 admin center.
