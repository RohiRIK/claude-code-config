# e2e-runner

**Agent:** End-to-end testing specialist using Playwright.

**Model:** opus

**Description:** End-to-end testing specialist using Playwright. Use PROACTIVELY for generating, maintaining, and running E2E tests. Manages test journeys, quarantines flaky tests, uploads artifacts, and ensures critical user flows work.

---

## Overview

The e2e-runner agent creates, maintains, and executes comprehensive Playwright E2E tests for critical user journeys.

## When to Invoke

| Trigger | Context |
|---------|---------|
| "write E2E tests" | New test creation |
| "run E2E" | Test execution |
| "fix flaky test" | Test maintenance |
| Critical flows | Before releases |

## Core Responsibilities

1. **Test Journey Creation**
   - Write Playwright tests for user flows
   - Page Object Model pattern
   - Meaningful test descriptions

2. **Test Maintenance**
   - Keep tests updated with UI changes
   - Fix broken locators
   - Update assertions

3. **Flaky Test Management**
   - Identify unstable tests
   - Quarantine with `@flaky` tag
   - Create issues for fixes

4. **Artifact Management**
   - Screenshots on failure
   - Video recording
   - Trace collection

## Test Structure

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── register.spec.ts
│   ├── markets/
│   │   ├── browse.spec.ts
│   │   └── search.spec.ts
│   └── wallet/
├── fixtures/
│   ├── auth.ts
│   └── markets.ts
└── playwright.config.ts
```

## Page Object Model

```typescript
export class MarketsPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly marketCards: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.locator('[data-testid="search-input"]')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForResponse(...)
  }
}
```

## Commands

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test tests/markets.spec.ts

# Headed mode
npx playwright test --headed

# Debug
npx playwright test --debug

# Generate test
npx playwright codegen http://localhost:3000
```

## Critical User Journeys

| Journey | Priority | Description |
|---------|----------|-------------|
| Authentication | HIGH | Login, logout, registration |
| Core features | HIGH | Market creation, trading |
| Search | MEDIUM | Search and filtering |
| Wallet | HIGH | Connect, transactions |

## Flaky Test Handling

```typescript
// Quarantine flaky test
test('flaky: market search', async ({ page }) => {
  test.fixme(true, 'Issue #123')
  // Test code...
})
```

## Related

- **Uses:** [FrontendDesign skill](../skills/frontend-design.md)
- **See also:** [tdd-guide](tdd-guide.md), [code-reviewer](code-reviewer.md)

---

*Documentation generated from `agents/e2e-runner.md` - Last updated: 2026-02-25*
