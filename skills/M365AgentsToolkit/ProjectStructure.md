# M365AgentsToolkit — Project Structure

## Generated Project Structure

After running `atk new -c weather-agent -n myagent`, you get:

```
myagent/
├── appPackage/              # App manifest and assets
│   ├── manifest.json        # M365 app manifest
│   ├── color.png           # App icon (color)
│   └── outline.png          # App icon (outline)
├── env/                    # Environment files
│   ├── .env.local          # Local dev environment
│   └── .env.dev            # Dev environment
├── src/
│   ├── index.ts            # Agent entry point
│   ├── agent.ts            # Agent definition
│   ├── actions/            # Custom actions
│   │   └── weather.ts
│   └── utils/
│       └── helpers.ts
├── tests/                  # Test files
│   └── agent.test.ts
├── m365agents.yml         # Provision/deploy config
├── package.json
├── tsconfig.json
└── README.md
```

## m365agents.yml Structure

```yaml
# Provision: Create Azure resources
provision:
  name: myagent
  resources:
    - name: web
      type: azure-web-app
      runtime: nodejs-18
      region: eastus

# Deploy: Deploy to Azure
deploy:
  - uses: azure-web-app/deploy
    with:
      artifact: ./dist
      runtime: nodejs-18

# Publish: Publish to M365 store
publish:
  - uses: microsoft-365/app-catalog/upload
```

## Key Files

### src/index.ts

```typescript
import { CloudAdapter, ConfigurationServiceFactory, TurnContext } from "microsoft/agents";
import { ApplicationBuilder, MemoryStorage } from "agents";
import { weatherAction } from "./actions/weather";

const adapter = new CloudAdapter(ConfigurationServiceFactory.getConfiguration());

const app = new ApplicationBuilder()
  .withStorage(new MemoryStorage())
  .withAdapter(adapter)
  .withDefaultRoyaltyAPI({
    spelling: "auto"
  })
  .build();

// Register actions
app.ai.registerAction("weather", weatherAction);

// Export for Azure Functions
export default app;
```

### appPackage/manifest.json

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.17/microsoft365.schema.json",
  "id": "{{AZURE_APP_CLIENT_ID}}",
  "packageName": "com.mycompany.weatheragent",
  "version": "1.0.0",
  "developer": {
    "name": "My Company",
    "websiteUrl": "https://myapp.azurewebsites.net",
    "privacyUrl": "https://myapp.azurewebsites.net/privacy",
    "termsOfUseUrl": "https://myapp.azurewebsites.net/terms"
  },
  "name": {
    "short": "Weather Agent"
  },
  "description": {
    "short": "Get weather updates",
    "full": "AI agent that provides weather information"
  },
  "accentColor": "#FFFFFF",
  "staticTabs": [
    {
      "entityId": "home",
      "name": "Home",
      "contentUrl": "https://myapp.azurewebsites.net"
    }
  ],
  "bots": [],
  "extensions": [
    {
      "requirements": {
        "capabilities": [
          {
            "name": "DeclarativeAgent",
            "id": "weather-declarative-agent"
          }
        ]
      },
      "runtimes": [
        {
          "id": "weather-runtime",
          "type": "OAUTH2",
          "entrypoint": "https://myapp.azurewebsites.net/api/agent"
        }
      ],
      "identifier": "com.mycompany.weatheragent"
    }
  ]
}
```

## Environment Variables

### .env.local

```
M365_APP_CLIENT_ID=
M365_APP_TENANT_ID=
M365_APP_CLIENT_SECRET=
AZURE_SUBSCRIPTION_ID=
AZURE_RESOURCE_GROUP=
AZURE_WEB_APP_NAME=
```

## Key Configuration Options

### Declarative Agent

```typescript
// Define declarative agent in manifest.json
{
  "extensions": [
    {
      "requirements": {
        "capabilities": [
          {
            "name": "DeclarativeAgent",
            "id": "my-declarative-agent"
          }
        ]
      },
      "runtimes": [
        {
          "id": "my-runtime",
          "type": "OAUTH2",
          "entrypoint": "https://myapp.azurewebsites.net/api/agent"
        }
      ]
    }
  ]
}
```

### Custom Engine Agent

```typescript
import { Application, TurnContext } from "agents";

const app = new ApplicationBuilder()
  .withAIExtensions({
    name: "weather",
    enabled: true
  })
  .build();

app.ai.do("weather", async (context: TurnContext) => {
  const userQuery = context.activity.text;
  const weather = await fetchWeather(userQuery);
  return weather;
});
```
