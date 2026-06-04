---
name: docker-patterns
description: "Reference for Docker and Docker Compose local dev patterns."
user-invocable: false
---

# Docker Patterns

Docker and Docker Compose best practices for containerized development.

## When to Activate

- Setting up Docker Compose for local development
- Designing multi-container architectures
- Troubleshooting container networking or volume issues
- Reviewing Dockerfiles for security and size
- Migrating from local dev to containerized workflow

## Reference

Load the file matching the task:

| Topic | File |
|-------|------|
| Compose stack, multi-stage Dockerfiles, override files | `Compose.md` |
| Service discovery, custom networks, volume strategies | `Networking.md` |
| Dockerfile hardening, compose security, secrets, `.dockerignore` | `Security.md` |
| Logs, exec, inspect, rebuild, network debugging | `Debugging.md` |

## Anti-Patterns

```
# BAD: Using docker compose in production without orchestration
# Use Kubernetes, ECS, or Docker Swarm for production multi-container workloads

# BAD: Storing data in containers without volumes
# Containers are ephemeral -- all data lost on restart without volumes

# BAD: Running as root
# Always create and use a non-root user

# BAD: Using :latest tag
# Pin to specific versions for reproducible builds

# BAD: One giant container with all services
# Separate concerns: one process per container

# BAD: Putting secrets in docker-compose.yml
# Use .env files (gitignored) or Docker secrets
```
