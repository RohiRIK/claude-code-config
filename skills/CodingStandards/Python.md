# Python Standards

**Package Manager:** `uv` — NEVER `pip`, `pip3`, `conda`, or `poetry`.

## Package Management

| Task | Command |
|------|---------|
| Create project | `uv init` |
| Add dependency | `uv add <pkg>` |
| Install all deps | `uv sync` |
| Run script | `uv run script.py` |
| Run CLI tool | `uvx <tool>` |

## Types

- Full type hints on ALL function signatures: `def foo(x: int) -> str:`
- Use `from __future__ import annotations` for forward references
- Run `mypy` or `pyright` for type checking

## Data Shapes

- `pydantic.BaseModel` at system boundaries (APIs, config, external data)
- `@dataclass` for internal plain data structures
- Never pass raw `dict` across module boundaries — model it

```python
from pydantic import BaseModel

class UserInput(BaseModel):
    name: str
    email: str
    age: int
```

## Paths & IO

- Always `pathlib.Path` — never `os.path.join()` or string concatenation
- `Path.read_text()` / `Path.write_text()` over `open()`

```python
from pathlib import Path

config = Path.home() / ".config" / "app" / "config.json"
data = config.read_text(encoding="utf-8")
```

## Linting & Formatting

- `ruff check .` — linting
- `ruff format .` — formatting
- Replaces `black` + `flake8` + `pylint` entirely

## Error Handling

- Define custom exception classes for domain errors
- Never `except Exception: pass` — always log or re-raise

```python
class UserNotFoundError(Exception):
    def __init__(self, user_id: str) -> None:
        super().__init__(f"User '{user_id}' not found. Check the ID and try again.")
```
