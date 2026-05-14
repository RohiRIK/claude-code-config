# Python Starter Templates

Curated GitHub templates for scaffolding new Python/uv projects.

| Template | Repo | Use When |
|---|---|---|
| Modern CLI | [jlevy/simple-modern-uv](https://github.com/jlevy/simple-modern-uv) | Small CLI with uv + ruff, minimal boilerplate |
| FastAPI service | [barabum0/fastapi-template-uv](https://github.com/barabum0/fastapi-template-uv) | REST API with FastAPI + uv + mypy + Pytest |
| FastAPI workspace | [elefher/fastapi-uv-workspaces-template](https://github.com/elefher/fastapi-uv-workspaces-template) | Production FastAPI with Docker + workspace packages |
| Library | [a5chin/python-uv](https://github.com/a5chin/python-uv) | Publishable PyPI package with uv + ruff + type checking |

## Quickstart

```bash
# Any project — init with uv directly
uv init my-project && cd my-project

# Clone FastAPI template
git clone https://github.com/barabum0/fastapi-template-uv my-api
cd my-api && uv sync && uv run uvicorn app.main:app --reload

# Clone library template
git clone https://github.com/a5chin/python-uv my-lib
cd my-lib && uv sync
```
