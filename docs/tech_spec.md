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
/src
  /app                       # App Router: Main UI and components
    /room/[id]/page.tsx    # Dynamic room pages
    layout.tsx
    page.tsx
  /pages
    /api/socket.ts         # Socket.io server (local dev only)
  /components
    /ui                    # shadcn/ui base components
    /game                  # Game-specific components
  /game                      # Pure game logic and engine
  /hooks                     # Custom hooks
  /lib                       # General utilities and helpers
    /socket/handlers.ts    # Socket.io event handlers
  /stores                    # Zustand stores
  /types                     # TypeScript interfaces
/docs                      # Documentation
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

The `/design-mockups/screens` directory contains high-fidelity, functional React component mockups that serve as the primary visual and interactive reference for implementing the application's UI. These references should be consulted to ensure the final components built in `/src/components/game` match the project's design and UX goals.

### Game Engine Architecture

The `/src/game/` directory contains pure game logic, separated from UI and infrastructure concerns:

- **`room-manager.ts`** - Room creation, player management, state storage
- **`round-manager.ts`** - Round lifecycle, timer management, role rotation
- **`scoring-engine.ts`** - Risk/reward calculations, point distribution
- **`sabotage-manager.ts`** - Sabotage deployment, timing constraints, compatibility
- **`prompt-manager.ts`** - Game prompts selection and categorization
- **`game-rules.ts`** - Core game constants and validation rules

This separation allows the game logic to be tested independently and potentially reused across different interfaces.

### State Management Strategy

- **Single Zustand Store**: Centralized game state
- **Socket Synchronization**: Server authoritative, optimistic client updates
- **Immutable Updates**: Predictable state changes
- **Computed Selectors**: Derived values (current role, can deploy sabotage)

### Custom Hooks Pattern

- `useSocket()`: WebSocket connection and event management
- `useGameState()`: Game state access with selectors
- `useRole()`: Current player's role and permissions
- `useTimer()`: Round countdown with callbacks
- `useSabotage()`: Sabotage deployment logic and constraints

## Real-Time Communication

### Socket.io Architecture

- **Local Development Server**: A hybrid approach using a Next.js Pages API route (`/pages/api/socket.ts`) to run the Socket.IO server alongside the Next.js dev server. This enables rapid end-to-end testing in a local environment.
- **Production Server**: For production, the Socket.IO server is deployed as a separate, standalone Node.js service using `server.ts`. This long-running process is suitable for hosting on platforms like Railway or Heroku. **It cannot be deployed on Vercel's serverless functions.**
- **State Management**: For simplicity, game state is managed in-memory within the socket handlers (`/src/lib/socket/handlers.ts`). This is suitable for a single-server deployment model.
- **Event-Driven**: All game actions are managed through standardized socket events, with handlers located in `/src/lib/socket/handlers.ts`.

### State Synchronization

- **Authoritative Server**: Server holds canonical game state
- **Optimistic Updates**: UI updates immediately, server confirms
- **Conflict Resolution**: Server timestamp wins on disputes
- **Reconnection Handling**: Resume game state on network recovery
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
- **Single Server**: The architecture is designed for a single, standalone Socket.IO server and does not support horizontal scaling without moving to a centralized data store like Redis.
- **Deployment Model**: The hybrid setup (`/pages/api/socket.ts`) is for local development only. The production deployment uses `server.ts`.

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
