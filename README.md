# Claude Code Environment

**Last Updated:** 2026-01-25

---

## Overview

This is a production Claude Code environment with advanced configuration, custom skills, and productivity optimizations.

---

## Configuration

### Core Settings (`~/.claude.json`)

**Cost Protection:**
- Monthly budget: $50
- Max tokens per request: 4,000
- Prevents unexpected API costs

**Performance Optimization:**
- Ignore patterns configured for common directories
- Prevents recursive scanning of:
  - `node_modules`, `.git`, `dist`, `build`
  - `.next`, `out`, `coverage`, `.cache`
  - `.vscode`, `.idea`

**MCP Servers:**
- GitHub (PRs, issues, repos)
- Firecrawl (web scraping)
- Memory (persistent knowledge)
- Sequential Thinking (chain-of-thought)
- Context7 (live documentation)
- Magic UI (components)
- Cloudflare Docs
- Filesystem access

---

## Custom Skills

### Productivity & Development

- **Audit** - Productivity auditing (`/audit`)
- **Goose** - Parallel agent orchestration
- **CreateSkill** - Skill generation framework
- **CreateCLI** - TypeScript CLI generator
- **TddWorkflow** - Test-driven development
- **BackendDesign** - Backend architecture patterns
- **FrontendDesign** - Modern frontend development

### Code Quality

- **CodingStandards** - Universal standards enforcement
- **SecurityReview** - Security auditing
- **StrategicCompact** - Context management
- **ContinuousLearning** - Memory persistence

### Utilities

- **FirstPrinciples** - Root cause analysis
- **Learned** - Pattern retrieval
- **Prompting** - Meta-prompt generation

### Goose Recipes (External Agents)

Located in: `~/.claude/skills/Goose/Recipes/`

- `architect.yaml` - System design
- `build-error-resolver.yaml` - Build fixes
- `code-reviewer.yaml` - Code quality review
- `security-reviewer.yaml` - Security analysis
- `tdd-guide.yaml` - Test-driven development
- `e2e-runner.yaml` - End-to-end testing
- `refactor-cleaner.yaml` - Dead code cleanup
- `doc-updater.yaml` - Documentation updates
- `planner.yaml` - Implementation planning
- **`claude-auditor.yaml` - Productivity audit** ⭐️

---

## Quick Start

### Running an Audit

```bash
# Via CLI
audit-claude run
audit-claude score
audit-claude history

# Via Claude Code
/audit
```

### Using Goose Agents

```bash
# Spawn agent
bun ~/.claude/skills/Goose/Tools/SpawnAgent.ts <recipe-name>

# Check status
bun ~/.claude/skills/Goose/Tools/AgentStatus.ts --list

# Collect results
bun ~/.claude/skills/Goose/Tools/CollectResults.ts --id <agent-id>
```

### Common Commands

```bash
# View configuration
cat ~/.claude.json | jq '.ignorePatterns, .monthlyBudget, .maxTokens'

# Check skills
ls ~/.claude/skills/

# View audit history
cat ~/.claude_productivity_history.json | jq '.audits[-1]'
```

---

## Directory Structure

```
~/.claude/
├── README.md                    # This file
├── .claude.json                 # Configuration
├── rules/                       # Global rules
│   ├── coding-style.md
│   ├── git-workflow.md
│   ├── testing.md
│   ├── performance.md
│   ├── patterns.md
│   ├── package-manager.md
│   ├── learned-summary.md
│   ├── hooks.md
│   ├── agents.md
│   └── security.md
├── skills/                      # Custom skills
│   ├── Audit/
│   ├── Goose/
│   ├── CreateSkill/
│   ├── CreateCLI/
│   └── [14+ more skills]
├── sessions/                    # Session history
├── history.jsonl               # Conversation history
└── .claude_productivity_history.json  # Audit logs
```

---

## Best Practices

### Cost Management

1. **Monitor usage**: Check `~/.claude.json` project stats
2. **Use Haiku for simple tasks**: 3x cost savings
3. **Stay within monthly budget**: $50 limit configured
4. **Review audit reports**: Run `/audit` monthly

### Performance

1. **Keep logs clean**: Archive old sessions
2. **Update ignore patterns**: Add project-specific directories
3. **Use caching**: Leverage prompt caching for repeated context
4. **Parallel operations**: Use Goose for concurrent tasks

### Development

1. **Follow TDD**: Use `/tdd` for new features
2. **Review code**: Use `/code-review` after changes
3. **Plan first**: Use `/plan` for complex features
4. **Document changes**: Update CLAUDE.md per project

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check disk usage: `du -sh ~/.claude/`
- Review audit score: `audit-claude score`

**Monthly:**
- Run full audit: `audit-claude run`
- Archive old sessions
- Update skills and MCP servers
- Review cost trends

### Troubleshooting

**High costs:**
- Check `monthlyBudget` in `~/.claude.json`
- Review `lastModelUsage` in project configs
- Ensure Opus is only used when needed

**Slow performance:**
- Verify ignore patterns are comprehensive
- Check log file sizes: `du -sh ~/.claude/*.jsonl`
- Archive old sessions: `tar -czf sessions-backup.tar.gz sessions/`

**Skills not triggering:**
- Validate skill with: `/createskill validate <skill-name>`
- Check TitleCase naming
- Verify USE WHEN triggers

---

## Support

**Documentation:**
- Skills: `~/.claude/skills/<SkillName>/SKILL.md`
- Rules: `~/.claude/rules/`
- CLI help: `audit-claude --help`

**Audit System:**
- Recipe: `~/.claude/skills/Goose/Recipes/claude-auditor.yaml`
- CLI source: `~/.local/bin/audit-claude-src/`
- History: `~/.claude_productivity_history.json`

---

## Version Info

- **Claude Code Version:** 2.1.19
- **Default Model:** Haiku 4.5
- **Audit Score:** 25/100 → 95/100 (after fixes)
- **Skills Installed:** 15+
- **Goose Recipes:** 19
- **MCP Servers:** 11

---

**Maintained by:** Rohi
**Organization:** rohi5054@gmail.com's Organization
