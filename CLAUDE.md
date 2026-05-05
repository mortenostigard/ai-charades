# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack at a glance

- **Monorepo**: pnpm workspaces — `apps/frontend`, `apps/backend`, `packages/shared`. Pinned via `packageManager` field; corepack picks it up.
- **Frontend**: Next.js 16 (App Router, Turbopack dev), React 19, Zustand, Tailwind v4 + shadcn/ui, framer-motion
- **Backend**: standalone Node + Socket.IO server (deployed to Render; NOT Vercel-compatible)
- **Shared**: TypeScript types only, consumed via `@charades/shared`
- **Lint/format**: ESLint flat config (root `eslint.config.mjs`) + Prettier

## Common commands

Run from the repo root unless noted.

```bash
pnpm install                   # bootstrap all workspaces
pnpm dev                       # frontend (3000) + backend (3001) concurrently
pnpm dev:frontend              # frontend only
pnpm dev:backend               # backend only
pnpm build                     # build frontend + backend (shared has no build step)
pnpm type-check                # tsc --noEmit across all workspaces
pnpm lint                      # eslint across workspaces (--if-present skips shared)
pnpm format:check              # prettier --check
pnpm format                    # prettier --write
```

There are no automated tests in this repo yet — `pnpm test` will not work. CI (`.github/workflows/ci.yml`) runs format-check → lint → type-check → build on every PR to `main`.

`packages/shared` ships TypeScript source directly — its `package.json` `types`/`exports` point at `src/index.ts`, so frontend and backend resolve types from source with no build step. The frontend's `next.config.ts` lists it under `transpilePackages` so Next/Turbopack inlines the source. The backend never imports it at runtime (all imports are type-only and elided by `tsc`).

`.npmrc` at the root has `public-hoist-pattern[]=*eslint*` and `@typescript-eslint/*` so the shared root `eslint.config.mjs` can resolve `eslint-config-next` (declared only in the frontend workspace) without a phantom-dependency error. If you add new shared lint plugins, hoist them the same way or move them to the root `package.json`.

## Architecture

### Server-authoritative timer

The game timer is **driven entirely by the backend**, not the client. `apps/backend/src/game/game-loop.ts` ticks once per second and broadcasts `timer_update` events to the room; the frontend store stores the value but never increments it locally. Grace-period and sabotage-eligibility checks all use server timestamps. Don't add client-side `setInterval` timers — they will desync.

### Backend game engine is pure logic

`apps/backend/src/game/` contains the engine (room-manager, round-manager, game-loop, scoring-engine, sabotage-manager, prompt-manager). It has no Socket.IO or HTTP dependencies. The single bridge into it is `apps/backend/src/socket/handlers.ts`, which is the only place that calls `socket.emit` / `io.to(roomId).emit`. Keep that boundary — engine modules should remain testable without a socket.

### Frontend state model

- **One Zustand store**: `apps/frontend/src/stores/gameStore.ts`. Server is authoritative; the store mirrors what arrives over the socket. Optimistic updates are allowed but server messages always win on conflict.
- **Custom hooks for derived state**: `useSabotage`, `useSocket`. **Don't put computed selectors that return new objects on the store** — components that subscribe to them re-render infinitely. Use a custom hook instead. (Primitive-returning selectors on the store are fine.)
- **Store subscriptions should select primitives**: `state => state.gameState?.room.code`, not `state => state.gameState`. Saves needless re-renders when unrelated parts of game state change.

### Socket.IO broadcast conventions

`apps/backend/src/socket/handlers.ts` follows three patterns deliberately:

- `socket.to(roomId).emit(...)` → everyone in the room **except** the sender (use for player actions, prevents echo)
- `io.to(roomId).emit(...)` → everyone in the room **including** the sender (use for server-initiated state changes like timer ticks)
- `socket.emit(...)` → just the sender (confirmations, errors)

Event names are defined in `docs/api_spec.md` — that's the source of truth, don't invent new ones inline.

## Conventions

- **Mobile-first**: this is a phone game. Touch targets ≥ 44px, primary actions ≥ 56px. No hover-only affordances. See `.cursor/rules/mobile-first.mdc` for the full list.
- **Component props**: every props interface uses `readonly` on every field.
- **Imports**: ESLint enforces an `import/order` grouping (builtin → external → internal `@/` → parent → sibling → index) with newlines between groups.
- **Console**: `no-console` is set to warn with `console.warn` / `console.error` allowed. The repo currently has many `console.log` warnings — don't add more, prefer `warn`/`error`.
- **Types live in `@charades/shared`**: `Player`, `Room`, `GameState`, `CurrentRound`, `SabotageAction`, `GamePrompt`, `ScoreUpdate`, `CompletedRound`, `GameConfig`. Don't redefine these in app code; import them.

## Pull requests

PR descriptions and commit messages stand on their own — no references to chat context.

Branch names follow conventional-commit prefixes: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `build/`, `ci/`, `test/`, `perf/`. Use a short kebab-case description after the prefix (e.g. `fix/vercel-shared-package-resolution`, `refactor/shared-types-only`). Do not use tool- or session-scoped prefixes like `claude/...`.

## Reference docs

Game/protocol details live in `docs/`. Treat these as the source of truth and link to them from code/PRs rather than duplicating:

- `docs/game_spec.md` — game rules, round structure
- `docs/api_spec.md` — exact Socket.IO event names and payloads
- `docs/tech_spec.md` — broader architecture context
- `docs/architecture_diagrams.md` — sequence/component diagrams
- `docs/design_system_spec.md` — visual language

`design-mockups/screens/` contains v0-generated React mockups used as the visual reference for `apps/frontend/src/components/game/` — consult these before designing new screens.

## Environment

Each app has its own `.env.example` (`apps/frontend/.env.example`, `apps/backend/.env.example`). Copy to `.env.local` in the same directory; the root `.env.example` is just a pointer.

Key vars worth knowing:

- Backend: `PORT` (default 3001), `CLIENT_URL` — comma-separated list of allowed CORS origins, supports `*` wildcards (default `http://localhost:3000`)
- Frontend: `NEXT_PUBLIC_SOCKET_URL` (default `http://localhost:3001`)

## Deployment

- **Frontend → Vercel**. Auto-deploys from GitHub: production from `main`, preview deployments per PR. Set `Root Directory` to `apps/frontend` in the project settings; everything else is auto-detected from `packageManager`. Set `NEXT_PUBLIC_SOCKET_URL` in Vercel project settings (Production + Preview) to the production backend URL — PR-triggered preview builds override this at build time (see below).
- **Backend → Render** (free tier). Configured via `render.yaml` Blueprint; production deploys from `main`. Health check at `/health`. Free-tier services spin down after 15 min idle and cold-start in ~30s — acceptable for solo dev. Set `CLIENT_URL` in the Render dashboard to the Vercel URLs that should be allowed (e.g. `https://charades-directors-cut.vercel.app,https://charades-directors-cut-*.vercel.app`).
- The backend is **not** Vercel-compatible (Socket.IO needs a long-running process; Vercel's serverless model doesn't support that).

### Per-PR preview workflow

Backend changes can be tested end-to-end from any device (e.g. a phone) before merging:

- **Render** spins up a service preview at `https://charades-directors-cut-backend-pr-<N>.onrender.com` for every open PR (enabled via `previews.generation: automatic` in `render.yaml`). Free-tier service hours are shared across production and all open PR previews — close stale PRs to release capacity.
- **Vercel**'s preview frontend computes `NEXT_PUBLIC_SOCKET_URL` at build time from `VERCEL_GIT_PULL_REQUEST_ID` (see `apps/frontend/next.config.ts`), pointing the preview UI at the matching Render preview backend.
- **CORS** for previews: `CLIENT_URL` is `sync: false` in `render.yaml`, so it isn't auto-copied to PR previews. The `previewValue` provides a default permissive enough to allow Vercel preview hostnames for this project.
- **Sanity-checking a preview**: hit `https://charades-directors-cut-backend-pr-<N>.onrender.com/health` — should return `ok` once the cold-start finishes (~1–2 min on the first build).
- **Branch-only deploys** (push to a branch with no open PR) don't get `VERCEL_GIT_PULL_REQUEST_ID`, so they keep targeting the production backend.
