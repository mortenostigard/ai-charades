# AI Charades: Director's Cut

Welcome to **AI Charades: Director's Cut**, a real-time multiplayer party game designed for mobile-first play. One player acts out prompts while another can deploy sabotage actions to make it more challenging and fun.

This project is built with a modern tech stack, focusing on real-time communication and a great user experience for a party setting.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14 (App Router)
- **Real-time Communication**: [Socket.io](https://socket.io/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Linting & Formatting**: ESLint & Prettier

## Getting Started

To run the development environment, you will need to start both the Next.js frontend application and the Socket.io server.

### Option 1: Development Mode (Recommended)

Start both the frontend and Socket.io server with a single command:

```bash
npm run dev
```

This will start:

- Next.js frontend on `http://localhost:3000`
- Socket.io server on `http://localhost:3001`

### Option 2: Separate Processes

If you need to run them separately (e.g., for debugging or deployment testing):

**1. Start the Socket.io Server**

```bash
npm run dev:server
```

The server will start on `http://localhost:3001` and output: `Socket.IO server running on port 3001`

**2. Start the Next.js Frontend**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

This project includes several scripts to help with development:

- `npm run dev`: Starts both the Next.js development server and Socket.io server.
- `npm run dev:server`: Starts only the Socket.io development server.
- `npm run build`: Creates a production build of the Next.js app.
- `npm run build:server`: Compiles the Socket.io server for production.
- `npm run start`: Starts the production Next.js server.
- `npm run start:server`: Starts the production Socket.io server.
- `npm run lint`: Lints the codebase for errors.
- `npm run format`: Formats all files with Prettier.
- `npm run type-check`: Runs the TypeScript compiler to check for type errors.

## Deployment

### Frontend (Next.js)

Deploy the frontend to [Vercel](https://vercel.com/new):

```bash
npm run build
npm run start
```

### Socket.io Server

The Socket.io server needs to be deployed separately. Here are your options:

**Option 1: Build and Deploy Compiled Server**

```bash
# Build the server
npm run build:server

# Deploy the compiled server (dist/server.js) to your hosting provider
npm run start:server
```

**Option 2: Deploy with ts-node (Development/Testing)**

```bash
npm run dev:server
```

### Environment Variables

Make sure to configure these environment variables on your server deployment:

- `CLIENT_URL`: Your frontend's URL (e.g., `https://your-app.vercel.app`)
- `PORT`: The port your server should listen on (default: 3001)

### Recommended Deployment Platforms

- **Server**: Railway, Render, Heroku, or any Node.js hosting service
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
