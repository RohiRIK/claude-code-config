# Rust Starter Templates

Curated GitHub templates for scaffolding new Rust projects. All support `cargo generate`.

| Template | Repo | Use When |
|---|---|---|
| CLI binary | [rust-starter/rust-starter](https://github.com/rust-starter/rust-starter) | CLI tool with clap, logging, error handling, static binary |
| Axum REST API | [joelparkerhenderson/demo-rust-axum](https://github.com/joelparkerhenderson/demo-rust-axum) | Web API with Tokio, Tower, Hyper, routing |
| Library crate | [rust-vmm/crate-template](https://github.com/rust-vmm/crate-template) | Publishable crate to crates.io, production-grade CI |
| WASM | [rustwasm/wasm-pack-template](https://github.com/rustwasm/wasm-pack-template) | Rust compiled to WebAssembly, wasm-pack compatible |
| Embedded | [rust-embedded/cortex-m-quickstart](https://github.com/rust-embedded/cortex-m-quickstart) | Bare-metal ARM Cortex-M firmware |

## Quickstart

```bash
# Install cargo-generate once
cargo install cargo-generate

# Scaffold a CLI
cargo generate --git https://github.com/rust-starter/rust-starter

# Scaffold a library
cargo generate --git https://github.com/rust-vmm/crate-template

# Scaffold WASM
cargo generate --git https://github.com/rustwasm/wasm-pack-template --name my-project
```
