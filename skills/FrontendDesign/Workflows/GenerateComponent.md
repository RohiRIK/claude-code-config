---
description: Scaffolds a new React component following strict composition and accessibility patterns.
intent_map:
  "make a component": "--name"
  "create ui": "--name"
---

# Workflow: GenerateComponent

This workflow generates a production-ready React component structure.

## Prerequisites
- **Context**: Read `skills/FrontendDesign/Context-FrontendPatterns.md` to understand the "Composition Over Inheritance" and "Compound Components" patterns.

## Steps

### 1. Identify Requirements
Analyze the user's request to determine:
- **Component Name** (e.g., `DataCard`, `UserList`).
- **Functionality** (Display, Interactive, Form, etc.).
- **Sub-components** needed (e.g., `Header`, `Body`, `Footer`, `Item`).

### 2. Scaffold Interface
Define the Props interface first. Avoid `any`.
- If the component wraps content, ensure `children: React.ReactNode` is included.
- Use discriminated unions for `variant` props if applicable.

### 3. Implement Component
Write the code using the **Compound Component** pattern if it involves multiple related parts.

**Template Structure:**
```typescript
import React from 'react';
import { cn } from '@/lib/utils'; // Assumed utility

interface [Name]Props {
  children: React.ReactNode;
  className?: string;
}

export function [Name]({ children, className }: [Name]Props) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  );
}

export function [Name]Header({ children }: { children: React.ReactNode }) {
  return <div className="header-styles">{children}</div>;
}
```

### 4. Accessibility Check
- Does it need `role` attributes?
- Are keyboard interactions (Enter, Space, Escape) handled?
- Refer to the "Accessibility Patterns" section in `Context-FrontendPatterns.md`.

### 5. Final Output
Present the complete code block to the user.
