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
  /app
    /room/[id]/page.tsx    # Dynamic room pages
    /api/socket/route.ts   # Socket.io handler
    layout.tsx
    page.tsx
  /components
    /ui                    # shadcn/ui base components
    /game                  # Game-specific components
  /hooks                   # Custom hooks
  /lib                     # Utilities and game engine
  /stores                  # Zustand stores
  /types                   # TypeScript interfaces
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

- **Server**: Next.js API routes with Socket.io
- **Client**: React hooks wrapping Socket.io client
- **Room Management**: In-memory storage (Redis for production scaling)
- **Event-Driven**: All game actions through socket events

### State Synchronization

- **Authoritative Server**: Server holds canonical game state
- **Optimistic Updates**: UI updates immediately, server confirms
- **Conflict Resolution**: Server timestamp wins on disputes
- **Reconnection Handling**: Resume game state on network recovery

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

- **In-Memory Storage**: Rooms lost on server restart
- **Single Server**: No horizontal scaling
- **Basic Error Handling**: Minimal retry logic

### Future Improvements

- **Redis**: Persistent room storage
- **Load Balancing**: Multiple Socket.io servers
- **Database**: Player statistics and game history
- **CDN**: Asset optimization and global distribution

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
