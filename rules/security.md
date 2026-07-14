# Security Guidelines

## Secret Management

Never hardcode secrets. Read from `process.env` and throw on missing:

```typescript
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
```

## Security Response Protocol

If a security issue is found:
1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues
