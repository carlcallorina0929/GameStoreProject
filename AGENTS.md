# GameStoreProject

## Structure

This is a monolith with two packages under `game-store/`:

| Directory | Role | Stack |
|---|---|---|
| `AngularFrontend/` | SPA ("Game Den") | Angular 21, standalone components, NG-ZORRO, Tailwind CSS, Vitest |
| `BackendConfig/` | REST API | Express 5 (CommonJS), MySQL 2 (Aiven/SSL), JWT, Multer |

- **No root `package.json` in `game-store/`**: All `npm` commands must be run from within `game-store/AngularFrontend/` or `game-store/BackendConfig/`.
- Entrypoint: `AngularFrontend/src/main.ts` → `bootstrapApplication(App, appConfig)`
- Backend entry: `BackendConfig/server.js` → `BackendConfig/app.js`

## Commands

```bash
# --- Frontend (game-store/AngularFrontend/) ---
npm start          # ng serve on :4200
npm run build      # ng build (production, outputs to dist/)
npm test           # npx ng test (Vitest under @angular/build:unit-test)

# --- Backend (game-store/BackendConfig/) ---
npm run devStart   # nodemon server.js (auto-restart)
npm start          # node server.js (production)
```

- No lint or typecheck scripts are configured in either `package.json`.

## Testing

- **Frontend:**
    - Vitest runner via `@angular/build:unit-test` (not Karma/Jasmine).
    - Spec files live next to their component (`*.spec.ts`).
    - Config: `tsconfig.spec.json` sets `"types": ["vitest/globals"]`.
    - Only `app.spec.ts` exists in `AngularFrontend/src/app/`.
- **Backend:** No backend tests exist.

## Key Conventions & Quirks

- **Standalone components only** — no `NgModule`. Add components by importing directly in the consuming component.
- **Auth** — two localStorage keys: `token` (user) and `admin_token` (admin). The `authInterceptor` picks the right one based on `/api/admin/` in the URL.
- **Routing** — lazy-loaded admin section under `/admin` with its own guard. User routes gated by `userAuthGuard`. `app.ts` hides navbar/footer on admin and auth-landing routes.
- **DB** — MySQL via `mysql2/promise` pool with SSL CA cert. Connection configured in `BackendConfig/config/db.js`. Schema in `gameStoreSchema.sql`.
- **Environment Variables**: `BackendConfig/.env` contains sensitive credentials (DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET). **DO NOT** expose or commit these. `DB_SSL_CA_FILE` points to `BackendConfig/config/ca.pem`.
- **Formatting** — Prettier with `singleQuote: true`, `printWidth: 100`, Angular HTML parser (`/.prettierrc` in `AngularFrontend/`).
- **File uploads** — served from `/uploads` static dir; multer middleware handles multipart.
- **CORS** — allows `Authorization` and `Content-Type` headers, credentials enabled.
- **Redundant `navbar.component.ts`**: There is an outdated/orphaned `navbar.component.ts` at the project root which conflicts with `game-store/AngularFrontend/src/app/navbar/navbar.ts`.