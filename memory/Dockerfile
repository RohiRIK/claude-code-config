FROM oven/bun:1 AS base
WORKDIR /app

# Copy dependency files first for layer caching
COPY memory/package.json memory/bun.lock ./memory/
COPY hooks/lib/resolveProject.ts ./hooks/lib/resolveProject.ts

# Install dependencies
RUN cd memory && bun install --frozen-lockfile

# Copy the rest of the source
COPY memory/ ./memory/
COPY hooks/lib/ ./hooks/lib/

# Ensure ~/.claude/memory and ~/.claude/tmp exist
# On Render, mount Persistent Disk at /home/bun/.claude
ENV HOME=/home/bun
RUN mkdir -p /home/bun/.claude/memory /home/bun/.claude/tmp

EXPOSE 7331

CMD ["bun", "run", "memory/server.ts"]
