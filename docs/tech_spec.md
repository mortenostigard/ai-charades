# Technical Specification

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Real-time Communication**: Socket.io
- **Deployment**: Vercel
- **Development**: Cursor IDE with AI assistance

## Architecture Patterns

### Project Structure

```
./apps
  /frontend                 # Next.js 14 application (App Router)
    /src
      /app                 # Main UI and routes
        /room/[code]/page.tsx  # Dynamic room pages (App Router)
        layout.tsx
        page.tsx
      /components
        /ui                # shadcn/ui base components
        /game              # Game-specific components
      /hooks               # Custom React hooks
      /stores              # Zustand stores
  /backend                  # Stand-alone Node service for Socket.IO
    server.ts              # Entry point (creates HTTP + Socket.IO server)
    /src
      /socket/handlers.ts  # Socket.io event handlers (game logic bridge)
      /game                # Pure game logic and engine (room-manager, etc.)

./packages
  /shared                  # Re-usable TypeScript types shared via pnpm workspaces
    /src/types

./docs                      # Documentation
```

### Component Architecture

**Container/Presentation Pattern:**

- `HomeScreen` (entry point to create/join a room)
- `GameRoom` (container that manages overall game state and routing)
- `WaitingRoom` (lobby where players gather before the game)
- `RoleAssignmentScreen` (transition view showing player their role)
- `ActiveGame` (container for the main round views)
  - `ActorView`, `DirectorView`, `AudienceView` (role-specific UIs)
- `RoundSummaryScreen` (displays scores and outcome after each round)
- `GameCompleteScreen` (final scores and end-of-game options)
- `SharedGameInfo` (reusable components like timer, scores, prompt)

### Design & Component Mockups

The `/design-mockups/screens` directory contains high-fidelity, functional React component mockups created during the design phase by using v0. They serve as the primary visual and interactive reference for implementing the application's UI. These references should be consulted to ensure the final components built in `/src/components/game` match the project's design and UX goals.

### Game Engine Architecture

The `apps/backend/src/game/` directory contains pure game logic, separated from UI and infrastructure concerns:

- **`room-manager.ts`** - Room creation, player management, state storage
- **`round-manager.ts`** - Round lifecycle, role rotation, delegates to GameLoop
- **`game-loop.ts`** - Server-authoritative timer with 1-second broadcasts to clients
- **`scoring-engine.ts`** - Risk/reward calculations, point distribution
- **`sabotage-manager.ts`** - Sabotage deployment, timing constraints, compatibility
- **`prompt-manager.ts`** - Game prompts selection and categorization
- **`game-rules.ts`** - Core game constants and validation rules

#### Timer Implementation

The game timer is **server-authoritative** to ensure synchronized gameplay:

- **GameLoop** manages timer intervals and broadcasts `timer_update` events
- **RoundManager** delegates timer responsibility to GameLoop
- **Client Store** receives timer updates via socket events, no local calculation
- **Grace Period Logic** uses server timestamps for accurate validation

This separation allows the game logic to be tested independently and potentially reused across different interfaces.

### State Management Strategy

- **Single Zustand Store**: Centralized game state
- **Socket Synchronization**: Server authoritative, optimistic client updates
- **Immutable Updates**: Predictable state changes using Immer middleware
- **Computed Selectors**: Derived values (current role, host status, sabotage eligibility)

### Custom Hooks Pattern

- `useSocket()`: WebSocket connection and event management
- `useSabotage()`: Sabotage deployment logic and grace period state

## Real-Time Communication

### Socket.io Architecture

The project now uses a dedicated real-time service located at **`apps/backend`** for **both development and production**.

- **Backend Service** (`apps/backend/server.ts`): A long-running Node.js process that creates an HTTP server and attaches Socket.IO. During local development you run this process (e.g. `pnpm --filter backend dev`) alongside the Next.js dev server (`apps/frontend`). For production it can be deployed to Railway, Fly.io, or any container host. **It is not compatible with Vercel's serverless runtime.**
- **CORS & Environment Variables**: The backend reads `CLIENT_URL` (defaults to `http://localhost:3000`) to allow the frontend origin. The frontend reads `NEXT_PUBLIC_SOCKET_URL` (defaults to `http://localhost:3001`) to know where to connect.
- **State Management**: Game state is kept in-memory inside the Socket.IO handlers (`apps/backend/src/socket/handlers.ts`). This is acceptable for the single-server MVP.
- **Event-Driven Design**: All gameplay actions flow through the Socket.IO event handlers defined in `apps/backend/src/socket/handlers.ts` following the patterns in `@docs/api_spec.md`.

### State Synchronization

- **Authoritative Server**: Server holds canonical game state
- **Optimistic Updates**: UI updates immediately, server confirms
- **Conflict Resolution**: Server timestamp wins on disputes
- **Reconnection Handling**: Resume game state on network recovery

### Deployment Architecture

- **Main Application**: Deployed to Vercel to leverage its global CDN, serverless functions for standard API routes, and CI/CD pipeline.
- **Socket.IO Server**: The real-time server (`server.ts`) will be deployed separately to a long-running container service. The Next.js client will connect to this service's public URL, configured via environment variables.
- **Environment Variables**: `NEXT_PUBLIC_SOCKET_URL` will be used to tell the client where to connect.

## Mobile-First Constraints

### Responsive Design

- **Primary**: Mobile portrait (320px-768px)
- **Secondary**: Mobile landscape (rotated for better acting)
- **Bonus**: Tablet/Desktop (shared device scenarios)

### Touch Interactions

- **Minimum Touch Targets**: 44px for accessibility
- **Haptic Feedback**: Vibration for sabotage notifications
- **Large Typography**: Readable text for various lighting conditions
- **Thumb-Friendly Layout**: Important controls within thumb reach

### Performance Optimization

- **Component Lazy Loading**: Load views on demand
- **Socket Connection Management**: Handle background/foreground transitions
- **Audio Context**: Manage mobile audio restrictions
- **Minimal Bundle Size**: Only essential dependencies

## Development Constraints

### Code Quality Standards

- **TypeScript Strict Mode**: No implicit any, proper typing
- **ESLint + Prettier**: Consistent code formatting
- **Component Composition**: Reusable, single-responsibility components
- **Error Boundaries**: Graceful failure handling
- **Accessibility**: WCAG 2.1 AA compliance where possible

### Testing Strategy (Future)

- **Unit Tests**: Custom hooks and utility functions
- **Integration Tests**: Socket event flows
- **E2E Tests**: Complete game rounds with multiple clients

### Git Workflow

- **Main Branch**: Production-ready code
- **Feature Branches**: Individual features
- **Conventional Commits**: Clear commit messages
- **PR Reviews**: Code quality gate (when team grows)

## Deployment Strategy

### Vercel Configuration

- **Environment Variables**: Socket URLs, room configurations
- **Serverless Functions**: Socket.io handlers
- **Edge Functions**: Global performance optimization
- **Preview Deployments**: Feature branch testing

### Monitoring (Future)

- **Socket Health**: Connection/disconnection rates
- **Game Analytics**: Completion rates, popular sabotages
- **Error Tracking**: Client-side error reporting
- **Performance Metrics**: Load times, real-time latency

## Scaling Considerations

### Current (MVP) Limitations

- **In-Memory Storage**: Rooms and player state are lost on server restart. This is an accepted trade-off for the MVP's scope.
- **Client State**: Similarly, all client-side state (managed by Zustand) is in-memory and will be lost on a page refresh. Users who refresh the page will be prompted to rejoin the room.
- **Single Server**: The architecture is designed for a single, standalone Socket.IO server and does not support horizontal scaling without moving to a centralized data store like Redis.
- **Deployment Model**: A single dedicated Socket.IO service (`apps/backend`) is used in all environments. Horizontal scaling would require moving game state to Redis or a similar store.

## Security Considerations

### Room Privacy

- **4-Digit Room Codes**: Collision handling
- **Room Expiration**: Auto-cleanup after 2 hours
- **No Authentication**: Anonymous play only
- **Rate Limiting**: Prevent spam room creation

### Data Protection

- **No Personal Data**: Anonymous gameplay
- **Temporary Storage**: No persistent user data
- **HTTPS Only**: Secure WebSocket connections
- **Input Validation**: Sanitize all client inputs
