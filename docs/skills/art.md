# Art

**Skill:** Visual content generation system

**Description:** Complete visual content system. USE WHEN user wants to create visual content, illustrations, diagrams, mermaid, flowchart, technical diagram, or infographics.

---

## Overview

The Art skill generates images, diagrams, and visual content using AI image generation. All outputs go to `~/Downloads/` first for user preview.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "blog header", "editorial illustration" | Essay |
| "D3.js chart", "dashboard" | D3Dashboards |
| "visualization" | Visualize |
| "mermaid", "flowchart" | Mermaid |
| "technical diagram" | TechnicalDiagrams |
| "taxonomy", "grid" | Taxonomies |
| "timeline" | Timelines |
| "framework", "2x2 matrix" | Frameworks |
| "comparison", "X vs Y" | Comparisons |
| "annotated screenshot" | AnnotatedScreenshots |
| "recipe card" | RecipeCards |
| "quote card" | Aphorisms |
| "map", "conceptual" | Maps |
| "stat card", "big number" | Stats |
| "comic", "panels" | Comics |
| "YouTube thumbnail" | YouTubeThumbnail |
| "PAI icon" | CreatePAIPackIcon |

## ⚠️ CRITICAL: Output to Downloads First

```
ALL GENERATED IMAGES GO TO ~/Downloads/ FIRST
NEVER output directly to project directories
User MUST preview in Finder/Preview before use
```

### Workflow

1. Generate to `~/Downloads/[descriptive-name].png`
2. User reviews in Preview
3. If approved, copy to final destination
4. Create WebP and thumbnail at final destination

## Image Generation

### Command

```bash
bun run ~/.claude/skills/Art/Tools/Generate.ts \
  --model nano-banana-pro \
  --prompt "[PROMPT]" \
  --size 2K \
  --aspect-ratio 1:1 \
  --thumbnail \
  --output ~/Downloads/blog-header-concept.png
```

### Multiple Reference Images

```bash
bun run ~/.claude/skills/Art/Tools/Generate.ts \
  --model nano-banana-pro \
  --prompt "Person from references at a party..." \
  --reference-image face1.jpg \
  --reference-image face2.jpg \
  --reference-image face3.jpg \
  --size 2K \
  --aspect-ratio 16:9 \
  --output ~/Downloads/character-scene.png
```

## Examples

| Example | Workflow | Result |
|---------|----------|--------|
| "create a header for my AI agents post" | Essay | Charcoal sketch, architectural aesthetic |
| "make a diagram showing the SPQA pattern" | TechnicalDiagrams | Structured architecture visual |
| "visualize humans vs AI decision-making" | Comparisons | Side-by-side charcoal sketch |

## Customization

Check for user customizations at:
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Art/`

- `PREFERENCES.md` - Aesthetic preferences
- `CharacterSpecs.md` - Character design
- `SceneConstruction.md` - Scene composition

## Related

- **Used by:** All agents for diagram generation
- **See also:** [Prompting skill](prompting.md)

---

*Documentation generated from `skills/Art/SKILL.md` - Last updated: 2026-02-25*
