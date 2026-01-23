#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULTS = {
  path: "src/components",
} as const;

// ============================================================================
// Templates
// ============================================================================

function getComponentTemplate(name: string): string {
  const lower = name.toLowerCase();
  return `import React from 'react';

export interface ${name}Props {
  children?: React.ReactNode;
  className?: string;
}

export function ${name}({ children, className = '' }: ${name}Props) {
  return (
    <div className={[ '${lower}', className ].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
`;
}

function getIndexTemplate(name: string): string {
  return `export * from './${name}';
`;
}

function getTestTemplate(name: string): string {
  return `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders children correctly', () => {
    render(<${name}>Test Content</${name}>);
    expect(screen.getByText('Test Content')).toBeDefined();
  });
});
`;
}

// ============================================================================
// Help Documentation
// ============================================================================

function showHelp(): void {
  console.log(`
GenerateComponent - Scaffold React components following PAI patterns.

USAGE:
  GenerateComponent <name> [options]

ARGUMENTS:
  name                  Name of the component (PascalCase, e.g., MyCard)

OPTIONS:
  --path <path>         Output directory (default: src/components)
  --help, -h            Show this help message

EXAMPLES:
  GenerateComponent MyCard
  GenerateComponent UserProfile --path src/features/users
`);
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  const name = args[0];
  if (name.startsWith("-")) {
    console.error("Error: Component name required as first argument.");
    showHelp();
    process.exit(1);
  }

  // Parse options
  const pathIdx = args.indexOf("--path");
  const basePath = pathIdx !== -1 && args[pathIdx + 1] ? args[pathIdx + 1] : DEFAULTS.path;

  const componentDir = join(basePath, name);

  if (existsSync(componentDir)) {
    console.error(`Error: Component directory ${componentDir} already exists.`);
    process.exit(1);
  }

  console.log(`Creating component ${name} at ${componentDir}...`);

  try {
    await mkdir(componentDir, { recursive: true });

    await writeFile(join(componentDir, `${name}.tsx`), getComponentTemplate(name));
    await writeFile(join(componentDir, "index.ts"), getIndexTemplate(name));
    await writeFile(join(componentDir, `${name}.test.tsx`), getTestTemplate(name));

    console.log(`✅ Component ${name} created successfully!`);
    console.log(`Files:`);
    console.log(`  - ${join(componentDir, `${name}.tsx`)}`);
    console.log(`  - ${join(componentDir, "index.ts")}`);
    console.log(`  - ${join(componentDir, `${name}.test.tsx`)}`);

  } catch (error) {
    console.error("Error creating component:", error);
    process.exit(1);
  }
}

main();