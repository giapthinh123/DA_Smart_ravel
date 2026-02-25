# AGENTS.md

## Cursor Cloud specific instructions

### Architecture
- **Backend**: Flask (Python 3.12) REST API on port `5000` — see `backend/run.py`
- **Frontend**: Next.js 15 (Turbopack) on port `3000` — see `frontend/package.json` scripts
- **Database**: MongoDB (remote Atlas or local) — connection via `MONGO_URI` in `backend/.env`

### Running services

1. **MongoDB**: Either use the remote Atlas URI already in `backend/.env`, or start a local instance with `sudo mongod --dbpath /data/db --fork --logpath /var/log/mongod.log`
2. **Backend**: `cd /workspace/backend && source venv/bin/activate && python run.py`
3. **Frontend**: `cd /workspace/frontend && pnpm dev`

### Non-obvious caveats

- The root `.gitignore` contains `lib/` which ignores `frontend/lib/`. Use `git add -f` when adding files under that directory.
- The root `.gitignore` also ignores `*/public` — be aware when working with frontend public assets.
- `frontend/pnpm-lock.yaml` is the canonical lockfile; use `pnpm install` (not npm).
- After `pnpm install`, you must run `pnpm rebuild` to build native deps (`@tailwindcss/oxide`, `sharp`, `unrs-resolver`) — or ensure `pnpm.onlyBuiltDependencies` is set in `package.json`.
- Backend requires `python3.12-venv` system package to create the virtual environment.
- The Flask rate limiter warns about in-memory storage — this is expected in dev.
- `backend/.env` and `frontend/.env.local` are gitignored and must be created manually. Backend needs: `SECRET_KEY`, `JWT_SECRET_KEY`, `MONGO_URI`, `MONGODB_DB_NAME`. Frontend needs: `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`.
- ESLint has ~117 pre-existing errors (mostly `@typescript-eslint/no-explicit-any`). These are in the existing codebase and not blocking for development.
- The `dashboard.css` file uses a separate dark theme with deeply embedded hardcoded colors (gold/navy). The main CSS variables are in `globals.css`.
