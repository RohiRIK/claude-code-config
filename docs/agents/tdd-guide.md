# tdd-guide

**Agent:** Test-Driven Development specialist enforcing write-tests-first methodology.

**Model:** opus

**Description:** Test-Driven Development specialist enforcing write-tests-first methodology. Use PROACTIVELY when writing new features, fixing bugs, or refactoring code.

---

## Overview

The tdd-guide agent enforces the Red-Green-Refactor TDD cycle, ensuring 80%+ test coverage and comprehensive testing.

## When to Invoke

| Trigger | Context |
|---------|---------|
| New feature | Write tests first |
| Bug fix | Test before fix |
| Refactor | Tests ensure safety |
| "TDD" | Test-driven development |
| "write tests" | Test creation |

## TDD Workflow

### Step 1: Write Test First (RED)
```typescript
describe('searchMarkets', () => {
  it('returns semantically similar markets', async () => {
    const results = await searchMarkets('election')
    expect(results).toHaveLength(5)
  })
})
```

### Step 2: Verify It FAILS
```bash
npm test
# Test should fail - no implementation yet
```

### Step 3: Write Minimal Implementation (GREEN)
```typescript
export async function searchMarkets(query: string) {
  const embedding = await generateEmbedding(query)
  return await vectorSearch(embedding)
}
```

### Step 4: Verify It PASSES
```bash
npm test
# Test should now pass
```

### Step 5: Refactor
- Remove duplication
- Improve names
- Optimize performance

### Step 6: Verify Coverage
```bash
npm run test:coverage
# Verify 80%+ coverage
```

## Test Types

### Unit Tests (Mandatory)
Test individual functions in isolation:
```typescript
describe('calculateSimilarity', () => {
  it('returns 1.0 for identical embeddings', () => {
    expect(calculateSimilarity(a, a)).toBe(1.0)
  })
})
```

### Integration Tests (Mandatory)
Test API endpoints and database:
```typescript
describe('GET /api/markets/search', () => {
  it('returns 200 with valid results', async () => {
    const response = await GET(request, {})
    expect(response.status).toBe(200)
  })
})
```

### E2E Tests (Critical Flows)
Test complete user journeys:
```typescript
test('user can search and view market', async ({ page }) => {
  await page.goto('/')
  await page.fill('input', 'election')
  await expect(page.locator('.market-card')).toHaveCount(5)
})
```

## Edge Cases to Test

1. **Null/Undefined** - What if input is null?
2. **Empty** - What if array/string is empty?
3. **Invalid Types** - Wrong type passed?
4. **Boundaries** - Min/max values
5. **Errors** - Network failures, DB errors
6. **Race Conditions** - Concurrent operations
7. **Large Data** - Performance with 10k+ items

## Test Quality Checklist

- [ ] All public functions have unit tests
- [ ] All API endpoints have integration tests
- [ ] Critical flows have E2E tests
- [ ] Edge cases covered
- [ ] Error paths tested
- [ ] Mocks for external dependencies
- [ ] Independent tests (no shared state)
- [ ] Meaningful test names
- [ ] Specific assertions
- [ ] 80%+ coverage

## Anti-Patterns

| ❌ Wrong | ✅ Right |
|---------|----------|
| Test internal state | Test user-visible behavior |
| Tests depend on each other | Independent tests |
| Test implementation details | Test behavior |
| No assertions | Meaningful assertions |

## Mocking External Dependencies

```typescript
// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: mockData }))
      }))
    }))
  }
}))

// Mock Redis
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() => Promise.resolve([...]))
}))
```

## Related

- **See also:** [e2e-runner](e2e-runner.md), [TddWorkflow skill](../skills/tdd-workflow.md)

---

*Documentation generated from `agents/tdd-guide.md` - Last updated: 2026-02-25*
