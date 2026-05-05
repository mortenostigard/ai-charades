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

The monorepo structure enables independent deployment of frontend and backend applications.

### Frontend (Next.js)

Deploy the frontend to [Vercel](https://vercel.com/new):

```bash
# Build the frontend
pnpm build:frontend

# Start production server
pnpm start:frontend
```

**Vercel Configuration**: Point your Vercel project to the `apps/frontend` directory.

### Backend (Socket.io Server)

Deploy the backend to your preferred Node.js hosting service:

```bash
# Build shared dependencies first
pnpm build:shared

# Build the server
pnpm build:backend

# Start production server
pnpm start:backend
```

### CI/CD with GitHub Actions

This project is configured for independent deployments using GitHub Actions:

- **Frontend**: Automatically deploys to Vercel when `apps/frontend/` or `packages/shared/` changes
- **Backend**: Automatically deploys to your chosen platform when `apps/backend/` or `packages/shared/` changes

### Environment Variables

Configure these environment variables for your deployments:

**Backend:**

- `CLIENT_URL`: Your frontend's URL (e.g., `https://your-app.vercel.app`)
- `PORT`: The port your server should listen on (default: 3001)

### Recommended Deployment Platforms

- **Frontend**: [Vercel](https://vercel.com) (recommended), Netlify, or Cloudflare Pages
- **Backend**: [Railway](https://railway.app), [Render](https://render.com), Heroku, or any Node.js hosting service

### Workspace Dependencies

The monorepo automatically handles shared dependencies:

- Both frontend and backend depend on `@ai-charades/shared`
- Changes to shared types automatically propagate to both applications
- Independent versioning and deployment of each application
