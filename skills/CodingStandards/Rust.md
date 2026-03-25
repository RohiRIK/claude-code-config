# Rust Standards

**Edition:** 2024 (`edition = "2024"` in Cargo.toml). **Runtime:** Tokio for async.

## Toolchain

```bash
rustup update stable          # keep toolchain current
cargo generate <template>     # scaffold from template
cargo clippy -- -D warnings   # lint (mandatory, zero warnings)
cargo nextest run             # preferred test runner
cargo fmt                     # format
```

## Naming

| Pattern | Use |
|---------|-----|
| `snake_case` | Variables, functions, modules, file names |
| `PascalCase` | Types, traits, enums, structs |
| `SCREAMING_SNAKE_CASE` | Constants, statics |
| `kebab-case` | Crate names in Cargo.toml |

Booleans must start with: `is_`, `has_`, `can_`, `should_`.

## Types

- Use `Result<T, E>` + `?` operator everywhere — never `.unwrap()` in production code
- `expect("descriptive reason")` is acceptable in tests and infallible paths only
- Prefer `&str` over `String` for read-only string parameters
- Use `impl Trait` for return types when the concrete type is an implementation detail
- Derive `Debug` on all public types

```rust
// ✅
fn parse_config(path: &str) -> Result<Config, ConfigError> {
    let raw = std::fs::read_to_string(path)?;
    let config: Config = toml::from_str(&raw)?;
    Ok(config)
}

// ❌ — crashes on error
fn parse_config(path: &str) -> Config {
    let raw = std::fs::read_to_string(path).unwrap();
    toml::from_str(&raw).unwrap()
}
```

## Error Handling

- **Applications:** `anyhow::Result` + `anyhow::Context` for rich error chains
- **Libraries:** `thiserror` — define typed `Error` enums, never `Box<dyn Error>`
- Never `panic!()` in library code — panic only in truly unrecoverable states

```rust
// Library error
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("config file not found at '{0}'")]
    ConfigNotFound(String),
    #[error("invalid config: {0}")]
    InvalidConfig(#[from] toml::de::Error),
}

// Application error chain
use anyhow::{Context, Result};

fn run() -> Result<()> {
    let config = load_config("config.toml")
        .context("failed to load configuration")?;
    Ok(())
}
```

## Async

- `#[tokio::main]` on `main()` — no manual `Runtime::new()`
- `async/await` for all I/O — never `std::thread::sleep` in async context
- `tokio::spawn` for concurrent tasks; `tokio::join!` to await multiple
- `tokio::sync::Mutex` not `std::sync::Mutex` inside async code

```rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let (a, b) = tokio::join!(fetch_users(), fetch_orders());
    Ok(())
}
```

## Unsafe

Every `unsafe` block requires a `// SAFETY:` comment explaining the invariant:

```rust
// SAFETY: ptr is guaranteed non-null and aligned by the caller contract
unsafe { ptr.as_ref().unwrap_unchecked() }
```

No `unsafe` without the comment — `clippy` will catch it.

## Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_valid_config_returns_ok() {
        let result = parse_config("fixtures/valid.toml");
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn fetch_user_returns_data() {
        let user = fetch_user("u1").await.unwrap();
        assert_eq!(user.id, "u1");
    }
}
```

Integration tests go in `tests/` at the crate root.

## Anti-Patterns ❌

| Anti-pattern | Fix |
|---|---|
| `.unwrap()` in production | `?` operator or `expect("reason")` |
| `String` param for read-only | `&str` |
| `Box<dyn Error>` in library | `thiserror` enum |
| `std::sync::Mutex` in async | `tokio::sync::Mutex` |
| `std::thread::sleep` in async | `tokio::time::sleep` |
| `panic!()` in library code | Return `Err(...)` |
| `unsafe` without SAFETY comment | Add `// SAFETY:` justification |
| Mutable global state | `once_cell::sync::Lazy` or pass as arg |
| Cloning everywhere to avoid borrow checker | Understand lifetimes, use `Arc<T>` for shared ownership |

## Context7

Always prepend `use context7` when looking up: `tokio`, `axum`, `serde`, `sqlx`, `clap`, `reqwest`, `tracing` APIs — these evolve with each minor release.
