# `just` alone lists recipes
default:
    @just --list

# ── Stack lifecycle ───────────────────────────────────────────────
up:
    docker compose up -d

down:
    docker compose down

build:
    docker compose build

rebuild: down
    docker compose build --no-cache
    docker compose up -d

ps:
    docker compose ps

logs service="":
    docker compose logs -f --tail=200 {{service}}

# ── Shells ────────────────────────────────────────────────────────
shell-backend:
    docker compose exec backend sh

shell-frontend:
    docker compose exec frontend sh

shell-db:
    docker compose exec db mariadb -u root -p${DB_ROOT_PASSWORD} ${DB_NAME}

# ── Dependency management (one-off containers, no host PHP/Bun) ───
composer +args:
    docker run --rm -v "$PWD/backend:/app" -w /app composer:2 {{args}}

bun +args:
    docker run --rm -v "$PWD/frontend:/app" -w /app oven/bun:1-alpine bun {{args}}

install: (composer "install --ignore-platform-req=ext-intl") (bun "install")

# ── Tests & coverage (inside a running backend container) ─────────
test *args:
    docker compose exec backend vendor/bin/phpunit {{args}}

coverage:
    docker compose exec backend vendor/bin/phpunit \
        --coverage-html=runtime/coverage \
        --coverage-text \
        --coverage-clover=runtime/coverage.xml

coverage-open: coverage
    open backend/runtime/coverage/index.html

# ── Lint / formatting (mirrors pre-commit.ci) ─────────────────────
# Requires `pip install pre-commit` on the host (or use pipx).
precommit-install:
    pre-commit install

lint:
    pre-commit run --all-files

precommit-update:
    pre-commit autoupdate

# ── Convenience ───────────────────────────────────────────────────
dev:
    lsof -ti:3000 | xargs kill -9 && bun next dev --port 3000

hello:
    curl -i http://localhost/api/hello

clean:
    rm -rf backend/vendor backend/runtime backend/config/packages \
           frontend/node_modules frontend/.next
