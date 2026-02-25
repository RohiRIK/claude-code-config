# doc-updater

**Agent:** Documentation and codemap specialist.

**Model:** opus

**Description:** Documentation and codemap specialist. Use PROACTIVELY for updating codemaps and documentation. Runs /update-codemaps and /update-docs, generates docs/CODEMAPS/*, updates READMEs and guides.

---

## Overview

The doc-updater agent generates and maintains architectural documentation and codemaps from the codebase. Ensures docs match reality.

## When to Invoke

| Trigger | Context |
|---------|---------|
| "update docs" | Documentation refresh |
| "generate codemap" | Architecture overview |
| "refresh README" | Project documentation |
| New feature | Documentation needed |

## Core Responsibilities

1. **Codemap Generation**
   - Create architectural maps from structure
   - Module analysis
   - Dependency mapping

2. **Documentation Updates**
   - Refresh READMEs
   - Generate from code
   - Validate docs

3. **AST Analysis**
   - TypeScript compiler API
   - Extract exports/imports
   - Find routes and models

## Codemap Structure

```
docs/CODEMAPS/
├── INDEX.md              # Overview
├── frontend.md           # Frontend structure
├── backend.md            # API structure
├── database.md           # Schema
├── integrations.md       # External services
└── workers.md            # Background jobs
```

## Codemap Format

```markdown
# [Area] Codemap

**Last Updated:** YYYY-MM-DD
**Entry Points:** list of main files

## Architecture

[ASCII diagram]

## Key Modules

| Module | Purpose | Exports | Dependencies |
|--------|---------|---------|--------------|
| ... | ... | ... | ... |

## Data Flow

[Description]

## External Dependencies

- package-name - Purpose, Version

## Related Areas

[Links to other codemaps]
```

## Tools

- **ts-morph** - TypeScript AST analysis
- **madge** - Dependency graphs
- **jsdoc-to-markdown** - JSDoc extraction

## Commands

```bash
npx ts-morph
npx madge --image graph.svg src/
npx jsdoc2md src/**/*.ts
```

## Quality Checklist

- [ ] Codemaps generated from actual code
- [ ] All file paths verified
- [ ] Code examples compile
- [ ] Links tested
- [ ] Freshness timestamps

## Related

- **Invoked by:** Manual command or after major changes
- **See also:** [ContentWriter skill](../skills/content-writer.md)

---

*Documentation generated from `agents/doc-updater.md` - Last updated: 2026-02-25*
