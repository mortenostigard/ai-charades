# AI Development Context & Guidelines

## Project Overview

Building **AI Charades: Director's Cut** - a real-time multiplayer party game where one player acts out prompts while another player can deploy sabotage actions to make it more challenging and entertaining.

## Key Constraints

- **Timeline**: 3 days total development time
- **Quality**: Production-ready code quality required
- **Scope**: MVP with core multiplayer functionality
- **Audience**: Friends drinking on Friday night (mobile-first, simple UX)

## Tech Stack Context

- **Next.js 14** with App Router and TypeScript
- **Socket.io** for real-time multiplayer communication
- **Zustand** for state management
- **Tailwind CSS + shadcn/ui** for styling
- **Vercel** for deployment

## Architecture Principles

### Code Standards

- **TypeScript strict mode**: No implicit any, proper interfaces
- **Component composition**: Single responsibility, reusable components
- **Custom hooks**: Extract logic into testable hooks
- **Error boundaries**: Graceful failure handling
- **Mobile-first responsive**: Touch-friendly, thumb navigation

### Patterns to Follow

- **Container/Presentation**: Separate data logic from UI rendering
- **Socket event-driven**: All game actions through WebSocket events
- **Optimistic updates**: Update UI immediately, sync with server
- **Immutable state**: Predictable Zustand state updates

## Development Priorities

### Phase 1: Foundation (Day 1)

1. **Socket.io setup**: Room creation, joining, basic events
2. **Core types**: TypeScript interfaces for all game entities
3. **Basic components**: Room lobby, player management
4. **State management**: Zustand store with socket synchronization

### Phase 2: Game Logic (Day 2)

1. **Round management**: Timer, role assignment, rotation
2. **Sabotage system**: Deployment, notifications, constraints
3. **Scoring system**: Risk/reward calculations
4. **Game flow**: Complete round lifecycle

### Phase 3: Polish (Day 3)

1. **UI/UX refinement**: Mobile optimization, visual feedback
2. **Error handling**: Network issues, edge cases
3. **Audio/haptics**: Notification sounds, vibration
4. **Deployment**: Vercel setup, testing

## AI Assistance Guidelines

### Code Generation Requests

**Always specify:**

- "Mobile-first responsive design"
- "Include TypeScript interfaces"
- "Add error handling"
- "Follow shadcn/ui patterns"
- "Include loading states"

### Component Requests

```
Create [ComponentName] that:
- Uses shadcn/ui components
- Has TypeScript props interface
- Includes error boundaries
- Works on mobile touch devices
- Follows the game-spec.md requirements
```

### Hook Requests

```
Build use[HookName] that:
- Returns typed data and actions
- Handles loading/error states
- Uses Zustand for state management
- Integrates with Socket.io events
- Includes cleanup functions
```

### Socket Event Requests

```
Implement [event-name] that:
- Follows api-spec.md definitions
- Includes client and server handling
- Has proper error responses
- Updates Zustand state correctly
- Maintains type safety
```

## Quality Checklist

### Every Component Should Have:

- [ ] TypeScript interface for props
- [ ] Error boundary or error handling
- [ ] Loading states for async operations
- [ ] Mobile-responsive design
- [ ] Proper accessibility attributes

### Every Hook Should Have:

- [ ] TypeScript return type
- [ ] Error state management
- [ ] Cleanup on unmount
- [ ] Dependency optimization
- [ ] Clear separation of concerns

### Every Socket Event Should Have:

- [ ] TypeScript payload interfaces
- [ ] Server-side validation
- [ ] Error response handling
- [ ] State synchronization
- [ ] Rate limiting consideration

## Common Patterns

### Component Structure

```tsx
interface ComponentProps {
  // Required props
  required: string;
  // Optional props with defaults
  optional?: boolean;
}

export function Component({ required, optional = false }: ComponentProps) {
  // Hooks at top
  // Event handlers
  // Early returns for loading/error
  // Main render
}
```

### Custom Hook Structure

```tsx
interface HookReturn {
  data: DataType | null;
  loading: boolean;
  error: string | null;
  actions: {
    action1: () => void;
    action2: (param: string) => Promise<void>;
  };
}

export function useCustomHook(): HookReturn {
  // State management
  // Effect hooks
  // Action functions
  // Return object
}
```

### Socket Event Handler

```tsx
// Client side
const handleEvent = useCallback(
  (payload: EventPayload) => {
    // Optimistic update
    // Error handling
    // State synchronization
  },
  [dependencies]
);

// Server side
socket.on('event-name', async payload => {
  // Validation
  // Business logic
  // Broadcast to room
  // Error responses
});
```

## Performance Considerations

- **Lazy load components**: Use dynamic imports for heavy components
- **Memoize expensive calculations**: useMemo for derived state
- **Debounce rapid events**: Prevent socket spam from user actions
- **Optimize re-renders**: useCallback for event handlers

## Mobile Optimization

- **Touch targets**: Minimum 44px for buttons
- **Haptic feedback**: Vibration for important actions
- **Viewport handling**: Proper mobile viewport meta tag
- **Audio context**: Handle mobile audio restrictions
- **Network resilience**: Handle poor connections gracefully

## Error Handling Strategy

- **Network errors**: Retry logic with exponential backoff
- **Invalid game states**: Request full state resync
- **User errors**: Clear feedback with suggested actions
- **Server errors**: Graceful degradation, maintain local state

## Testing Approach

- **Multi-tab testing**: Open multiple browser tabs for multiplayer
- **Mobile simulation**: Use Chrome DevTools device simulation
- **Network simulation**: Test with slow/flaky connections
- **Edge cases**: Test with minimum/maximum players

## Success Criteria

- [ ] Multiple players can join a room and play complete rounds
- [ ] Sabotage system works reliably with real-time updates
- [ ] Scoring system calculates correctly
- [ ] Mobile interface is touch-friendly and responsive
- [ ] Game is fun and engaging for 5+ minutes of play
- [ ] Code is clean, well-typed, and maintainable
- [ ] Deployment works smoothly on Vercel

## AI Interaction Tips

- Reference specific docs files for context
- Ask for complete implementations rather than snippets
- Request explanations of complex architectural decisions
- Use "improve this component to..." for iterative development
- Always specify mobile and TypeScript requirements
