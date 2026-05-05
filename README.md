# AI Charades: Director's Cut

Welcome to **AI Charades: Director's Cut**, a real-time multiplayer party game designed for mobile-first play. One player acts out prompts while another can deploy sabotage actions to make it more challenging and fun.

This project is structured as a monorepo with separate frontend and backend applications, enabling independent development and deployment.

## Project Structure

```
ai-charades/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # Socket.io server
├── packages/
│   └── shared/            # Shared types and utilities
└── package.json           # Workspace configuration
```

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14 (App Router)
- **Real-time Communication**: [Socket.io](https://socket.io/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Monorepo**: pnpm workspaces
- **Linting & Formatting**: ESLint & Prettier

## Getting Started

This monorepo uses pnpm workspaces to manage dependencies and run scripts across multiple applications. The package manager is pinned via the root `packageManager` field; corepack picks it up automatically on Node ≥ 22.

### Prerequisites

```bash
# Install all dependencies for all workspaces
pnpm install
```

### Development Mode

**Option 1: Start Everything (Recommended)**

```bash
pnpm dev
```

This will start:

- Next.js frontend on `http://localhost:3000`
- Socket.io server on `http://localhost:3001`
- Shared package in watch mode

**Option 2: Individual Applications**

```bash
# Start only the frontend
pnpm dev:frontend

# Start only the backend
pnpm dev:backend

# Build shared package
pnpm build:shared
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

### Root Level Scripts (Workspace Management)

- `pnpm dev`: Starts all applications in development mode
- `pnpm build`: Builds all applications for production
- `pnpm lint`: Lints all workspaces
- `pnpm type-check`: Type checks all workspaces

### Frontend Scripts

- `pnpm dev:frontend`: Starts the Next.js development server
- `pnpm build:frontend`: Creates a production build of the Next.js app
- `pnpm start:frontend`: Starts the production Next.js server

### Backend Scripts

- `pnpm dev:backend`: Starts the Socket.io development server
- `pnpm build:backend`: Compiles the Socket.io server for production
- `pnpm start:backend`: Starts the production Socket.io server

### Shared Package Scripts

- `pnpm build:shared`: Builds the shared types and utilities package

## Deployment

The monorepo splits between two hosts:

- **Frontend → [Vercel](https://vercel.com)**. Auto-deploys from GitHub: production from `master`, a preview deployment per PR. Set Root Directory to `apps/frontend`; pnpm and Node version are auto-detected. Configure `NEXT_PUBLIC_SOCKET_URL` (Production + Preview) to point at the backend.
- **Backend → [Render](https://render.com)** (free tier). Configured declaratively via `render.yaml` (Blueprint) — point a new Render Blueprint at this repo and it picks up the file. Health check is at `/health`. Free-tier services spin down after 15 min of idle and cold-start in ~30s. Set `CLIENT_URL` in the Render dashboard.

The Socket.IO backend can't run on Vercel (it needs a long-running process; Vercel's serverless model doesn't support that), which is why the backend lives on Render.

### Environment variables

**Backend** (Render dashboard):

- `CLIENT_URL` — comma-separated list of allowed CORS origins; supports `*` wildcards. Example: `https://ai-charades.vercel.app,https://ai-charades-*.vercel.app`
- `PORT` — Render injects this automatically; default `3001` for local

**Frontend** (Vercel project settings):

- `NEXT_PUBLIC_SOCKET_URL` — backend URL, e.g. `https://ai-charades-backend.onrender.com`
- Independent versioning and deployment of each application
