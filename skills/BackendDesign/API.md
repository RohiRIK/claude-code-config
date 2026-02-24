# REST API Design Patterns

Conventions for consistent, developer-friendly REST APIs.

## URL Structure

```
GET    /api/v1/users           # list
GET    /api/v1/users/:id       # get one
POST   /api/v1/users           # create
PUT    /api/v1/users/:id       # full replace
PATCH  /api/v1/users/:id       # partial update
DELETE /api/v1/users/:id       # delete

GET    /api/v1/users/:id/orders   # sub-resource
POST   /api/v1/orders/:id/cancel  # action (verb ok here)
```

Rules: nouns, plural, kebab-case, no verbs in path.

## Status Codes

```
200 OK            — GET, PUT, PATCH (with body)
201 Created       — POST (include Location header)
204 No Content    — DELETE, PUT (no body)
400 Bad Request   — malformed JSON
401 Unauthorized  — missing/invalid auth
403 Forbidden     — authenticated but not allowed
404 Not Found
409 Conflict      — duplicate, state conflict
422 Unprocessable — valid JSON, bad data
429 Too Many Requests
500 Internal Server Error (never expose details)
```

## Response Format

```json
// Single resource
{ "data": { "id": "abc", "email": "alice@example.com" } }

// Collection
{
  "data": [...],
  "meta": { "total": 142, "page": 1, "per_page": 20, "total_pages": 8 },
  "links": { "next": "/api/v1/users?page=2" }
}

// Error
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [{ "field": "email", "message": "Invalid format", "code": "invalid_format" }]
  }
}
```

## Pagination

**Offset** (simple, admin dashboards):
```
GET /api/v1/users?page=2&per_page=20
SELECT * FROM users ORDER BY created_at DESC LIMIT 20 OFFSET 20;
```

**Cursor** (scalable, feeds, >10K rows):
```
GET /api/v1/users?cursor=eyJpZCI6MTIzfQ&limit=20
SELECT * FROM users WHERE id > :cursor_id ORDER BY id ASC LIMIT 21;
```

## Filtering & Sorting

```
GET /api/v1/orders?status=active&customer_id=abc
GET /api/v1/products?price[gte]=10&price[lte]=100
GET /api/v1/products?sort=-created_at,price
GET /api/v1/users?fields=id,name,email
```

## Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000

# On 429:
Retry-After: 60
```

## Versioning

Use URL path versioning: `/api/v1/`, `/api/v2/`
- Keep max 2 active versions
- Non-breaking changes (add fields, add endpoints) — no new version needed
- Breaking changes (rename/remove fields, change types) — bump version

## TypeScript Validation Pattern (Zod + Next.js)

```typescript
const schema = z.object({ email: z.string().email(), name: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({
      error: { code: "validation_error", message: "Validation failed",
        details: parsed.error.issues.map(i => ({ field: i.path.join("."), message: i.message })) }
    }, { status: 422 });
  }
  const resource = await create(parsed.data);
  return NextResponse.json({ data: resource }, { status: 201, headers: { Location: `/api/v1/resources/${resource.id}` } });
}
```

## Checklist

- [ ] URL: plural, kebab-case, no verbs
- [ ] Correct HTTP method + status code
- [ ] Input validated (Zod/Pydantic)
- [ ] Error response has `code` + `message` + optional `details`
- [ ] List endpoints paginated
- [ ] Auth checked (authn + authz)
- [ ] Rate limiting configured
- [ ] No internal details leaked in errors
