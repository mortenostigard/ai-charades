# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack at a glance

- **Monorepo**: npm workspaces — `apps/frontend`, `apps/backend`, `packages/shared`
- **Frontend**: Next.js 16 (App Router, Turbopack dev), React 19, Zustand, Tailwind v4 + shadcn/ui, framer-motion
- **Backend**: standalone Node + Socket.IO server (NOT Vercel-compatible)
- **Shared**: TypeScript types only, consumed via `@ai-charades/shared`
- **Lint/format**: ESLint flat config (root `eslint.config.mjs`) + Prettier

## Common commands

Run from the repo root unless noted.

```bash
npm install                    # bootstrap all workspaces
npm run dev                    # frontend (3000) + backend (3001) concurrently
npm run dev:frontend           # frontend only
npm run dev:backend            # backend only
npm run build                  # build all workspaces
npm run build:shared           # rebuild shared types (frontend/backend consume dist/)
npm run type-check             # tsc --noEmit across all workspaces
npm run lint                   # eslint across workspaces (--if-present skips shared)
npm run format:check           # prettier --check
npm run format                 # prettier --write
```

There are no automated tests in this repo yet — `npm test` will not work. CI (`.github/workflows/ci.yml`) runs format-check → lint → type-check → build on every PR to `master`.

`packages/shared` must be built before frontend/backend type-check or build, because both consume its compiled `dist/`. The root `npm run build` handles ordering; if you're running things piecemeal, `build:shared` first.

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
- **Types live in `@ai-charades/shared`**: `Player`, `Room`, `GameState`, `CurrentRound`, `SabotageAction`, `GamePrompt`, `ScoreUpdate`, `CompletedRound`, `GameConfig`. Don't redefine these in app code; import them.

## Pull requests

PR descriptions and commit messages stand on their own — no references to chat context.

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

- Backend: `PORT` (default 3001), `CLIENT_URL` (CORS origin, default `http://localhost:3000`)
- Frontend: `NEXT_PUBLIC_SOCKET_URL` (default `http://localhost:3001`)
