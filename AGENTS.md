# GameStoreProject

Monolith under `game-store/` with two packages — no root `package.json` there.

| Directory | Role | Stack |
|---|---|---|
| `AngularFrontend/` | SPA ("Game Den") | Angular 21 standalone, NG-ZORRO, Tailwind CSS 4, Vitest |
| `BackendConfig/` | REST API | Express 5 (CommonJS), MySQL 2 (Aiven/SSL), JWT, Multer |

## Entrypoints

- Frontend: `AngularFrontend/src/main.ts` → `bootstrapApplication(App, appConfig)`
- Backend: `BackendConfig/server.js` → `BackendConfig/app.js` (`"type": "commonjs"`)
  - `server.js` loads dotenv before requiring `app.js`; `config/db.js` also loads dotenv independently.

## Commands

```bash
# --- Frontend (game-store/AngularFrontend/) ---
npm start       # ng serve :4200
npm run build   # ng build (production, dist/)
npm test        # ng test (Vitest via @angular/build:unit-test)

# --- Backend (game-store/BackendConfig/) ---
npm run devStart  # nodemon server.js (auto-restart)
npm start         # node server.js (production, :5000)
```

No lint or typecheck scripts in either package.

## Testing

- Frontend: Vitest with `jsdom`, config via `tsconfig.spec.json` (`"types": ["vitest/globals"]`), specs co-located (`*.spec.ts`).
- Backend: no tests.

## Architecture & Conventions

- **Standalone components only** — never create or use `NgModule`.
- **Auth** — two localStorage keys: `token` (user), `admin_token` (admin). `authInterceptor` picks by URL (`/api/admin/`). Guards check expiry client-side by parsing JWT payload.
- **Admin routing** — lazy-loaded under `/admin`, gated by `adminAuthGuard` (checks `role === "admin"` in JWT). User routes gated by `userAuthGuard`.
- **App.ts** hides navbar/footer on `/`, `/auth-landing`, and `/admin/*` routes.
- **Backend API** — 12 route modules under `routes/`, matching controllers in `controllers/`, models in `models/`. Regular auth: `authMiddleware.js` (JWT verify). Admin auth: `adminAuthMiddleware.js` (verifyToken → verifyAdminRole, re-checks DB).
- **DB** — MySQL via `mysql2/promise` pool (SSL CA cert from `config/ca.pem`, pool: 5 conns, 20s timeout, `rejectUnauthorized: true`). Schema: 8 tables, soft-delete via `isActive`. Discount system with `discount_percent` + date range on `games`.
- **.env** (`BackendConfig/.env`) — DO NOT expose/commit. `DB_SSL_CA_FILE=./config/ca.pem`. `JWT_SECRET` and full DB creds.
- **Frontend env** — `environments/environment.ts` defaults to production Render API (`game-store-api-fwxc.onrender.com`), not localhost (localhost is commented out).
- **CSS pipeline** — `angular.json` loads `theme.less` (NG-ZORRO) + `styles.css` (Tailwind base). PostCSS with Tailwind + Autoprefixer.
- **Formatting** — Prettier: `singleQuote: true`, `printWidth: 100`, Angular HTML parser.
- **File uploads** — multer middleware, served from `/uploads` static dir. `adminGameUpload.js` handles game image uploads.
- **CORS** — origin: true, credentials: true, allowed headers: `Content-Type`, `Authorization`.
- **Production budgets** — `angular.json`: initial 1.5 kB warning / 2 MB error, anyComponentStyle 20 kB warning / 30 kB error.

## Gotchas

- **Orphaned file at root**: `navbar.component.ts` (project root) is stale — the real one is `game-store/AngularFrontend/src/app/navbar/navbar.ts`.
- **Server startup query**: `server.js` runs `games.getAllFilteredGames()` on listen — will log error if DB is unreachable but does not crash.
- **`game-store/package-lock.json` exists** even though there's no `package.json` there — ignore it.
