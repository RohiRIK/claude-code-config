# docker-patterns

**Skill:** Docker and Docker Compose best practices.

**Description:** Docker and Docker Compose patterns for local development, container security, networking, volume strategies, and multi-service orchestration.

---

## Overview

The docker-patterns skill provides patterns for containerized development with Docker and Docker Compose.

## When to Activate

- Setting up Docker Compose for local development
- Designing multi-container architectures
- Troubleshooting container networking
- Reviewing Dockerfiles for security
- Migrating to containerized workflow

## Docker Compose Patterns

### Standard Web App Stack

```yaml
services:
  app:
    build:
      context: .
      target: dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s

  redis:
    image: redis:7-alpine
```

### Multi-stage Dockerfile

```dockerfile
# deps
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# dev
FROM node:22-alpine AS dev
COPY --from=deps /app/node_modules ./
COPY . .
CMD ["npm", "run", "dev"]

# build
FROM node:22-alpine AS build
COPY --from=deps /app/node_modules ./
COPY . .
RUN npm run build

# production
FROM node:22-alpine AS production
RUN addgroup -g 1001 -S app && adduser -S app -u 1001
USER app
COPY --from=build --chown=app:app /app/dist ./
CMD ["node", "dist/server.js"]
```

## Volume Strategies

| Type | Use Case |
|------|----------|
| Named volume | Persistent data (`pgdata`) |
| Bind mount | Source code for hot reload |
| Anonymous volume | Protect container deps |

## Security

```yaml
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
```

## Networking

- Service discovery via service name
- Custom networks for isolation
- Expose only needed ports

## Commands

```bash
docker compose up
docker compose up --build
docker compose logs -f app
docker compose exec compose down
```

 app sh
docker## Related

- **See also:** [BackendDesign skill](backend-design.md)

---

*Documentation generated from `skills/docker-patterns/SKILL.md` - Last updated: 2026-02-25*
