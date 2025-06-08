# AI Charades: Director's Cut - Development Plan

This document outlines the tasks required to complete the Minimum Viable Product (MVP) over a 3-day development period.

- **Day 1:** Foundation, Planning, and Scaffolding
- **Day 2:** Backend Core, State Management, and Lobby Implementation
- **Day 3:** Core Game Loop, Gameplay Mechanics, and Polish

## Relevant Files

- `src/types/index.ts` - Centralized TypeScript interfaces for all game entities ✅
- `src/app/api/socket/route.ts` - Main Socket.io server endpoint for real-time communication ✅
- `src/app/api/socket/handlers.ts` - Server-side Socket.io event handlers ✅
- `src/game/room-manager.ts` - Core game logic for room and player management ✅
- `src/stores/gameStore.ts` - Zustand store for global client-side state management ✅
- `src/hooks/useSocket.ts` - Custom hook to manage the client's Socket.io connection ✅
- `src/app/page.tsx` - The main home page component for creating or joining a room
- `src/app/room/[code]/page.tsx` - The room lobby component where players wait before the game starts

### Notes

- This plan focuses on building the core infrastructure. UI components will be implemented by referencing the examples in `/design-reference/screens`.
- Server-side logic will start with in-memory storage for simplicity, with the option to scale to Redis later.

### MVP Scope - Deferred to Post-Launch

To keep the 3-day MVP focused, we're intentionally deferring these features, but will implement if there is extra time left:

- **Advanced sabotage**: Complex compatibility rules (as defined in `docs/game_spec.md`) and multiple simultaneous sabotages.
- **Emoji reactions**: Audience emoji feedback system, including the `'send-reaction'` event and "Audience Favorite" scoring logic from the game and API specs.
- **Reconnection recovery**: Full game state recovery on reconnect as outlined in the "Reconnection Flow" in `docs/api_spec.md`. Basic reconnection will be handled, but full state restoration is deferred.
- **Room persistence**: Rooms expire on server restart.
- **Advanced error recovery**: Detailed error states and recovery flows.

## Tasks

### Day 1: Foundation & Planning (Complete)

- [x] 1.0 Initial project scaffolding and documentation review.
- [x] 2.0 Create comprehensive specifications for Game, API, Tech, and Design.
- [x] 3.0 Generate high-fidelity component references.
- [x] 4.0 Align on development plan and update `tech_spec.md`.

### Day 2: Backend, State & Lobby

- [x] 5.0 **Establish Core TypeScript Types**
  - [x] 5.1 Create `src/types/index.ts` and add all interfaces from `docs/api_spec.md`.
  - [x] 5.2 Export all types to ensure they are available across the application.
- [x] 6.0 **Implement Socket.io Server**
  - [x] 6.1 Install `socket.io`.
  - [x] 6.2 Create the initial server se tup in `src/app/api/socket/route.ts`.
  - [x] 6.3 Implement in-memory data structures for managing rooms and players.
  - [x] 6.4 Implement `create-room`, `join-room`, and `leave-room` event handlers.
  - [x] 6.5 Implement broadcasting for `player-joined` and `player-left` events to keep clients in sync.
  - [x] 6.6 Add basic `room-error` event handling for scenarios like "room not found" or "room full".
- [ ] 7.0 **Build Client-Side State Management**
  - [x] 7.1 Install `zustand` and `immer`.
  - [x] 7.2 Create `src/stores/gameStore.ts` with the `GameState` interface and associated actions.
  - [x] 7.3 Create the `useSocket` custom hook in `src/hooks/useSocket.ts` to initialize and manage the socket connection.
  - [x] 7.4 Integrate the `useSocket` hook with the `gameStore` to update the client's state based on server events.
  - [x] 7.5 Add connection error handling and reconnection logic.
  - [ ] 7.6 Implement optimistic updates for better UX (join room, etc.).
  - [ ] 7.7 Add computed selectors for role detection and permissions.
- [ ] 8.0 **Build Core UI Components & Navigation**
  - [ ] 8.1 Create the home page `src/app/page.tsx` with mobile-first design and create/join room functionality.
  - [ ] 8.2 Build reusable UI components: `RoomCodeInput`, `PlayerNameInput`, `LoadingSpinner`, `ErrorMessage` following design-system-spec.md patterns.
  - [ ] 8.3 Implement client-side room actions: create room, join room, and form validation.
  - [ ] 8.4 Create the lobby page `src/app/room/[code]/page.tsx` with real-time player list.
  - [ ] 8.5 Add room management UI: display room code, player count, and host controls.
  - [ ] 8.5.1 Implement host controls (e.g., "Start Game" button) that emit the 'start-game' event.
  - [ ] 8.6 Implement navigation and route protection (redirect if not in room).
  - [ ] 8.7 Add mobile-optimized error states and loading indicators.

### Day 3: Game Loop & Polish

- [ ] 9.0 **Implement Game Engine Components**
  - [ ] 9.1 Create `src/game/round-manager.ts` for round lifecycle, role rotation, and tracking overall game completion (e.g., all players have a turn as actor).
  - [ ] 9.2 Create `src/game/prompt-manager.ts` with initial game prompts data.
  - [ ] 9.3 Create `src/game/sabotage-manager.ts` with 10-20 basic sabotage actions
  - [ ] 9.4 Create `src/game/scoring-engine.ts` to implement the risk/reward logic from `docs/game_spec.md`.
  - [ ] 9.5 Add game and round socket event handlers: `start-game`, `start-round`, `round-started`, `timer-update`, `deploy-sabotage`, `round-complete`.
  - [ ] 9.6 Implement role assignment logic (actor, director, audience rotation).
- [ ] 10.0 **Build Game Views & Basic Mechanics**
  - [ ] 10.1 Create role-specific view components: `ActorView`, `DirectorView`, `AudienceView` with role-based color schemes.
  - [ ] 10.2 Implement game timer with real-time countdown display and warning states.
  - [ ] 10.3 Add prompt display for the Actor.
  - [ ] 10.4 Implement "Correct Guess" UI on the Director's view, allowing them to select a winner and end the round.
  - [ ] 10.5 Implement basic sabotage deployment UI (Director) and notification display (Actor).
  - [ ] 10.6 Build round completion and score display components.
  - [ ] 10.7 Add haptic feedback for sabotage notifications on mobile devices.
  - [ ] 10.8 Build a `GameCompleteScreen` to display final scores and winner, as defined in `docs/game_spec.md`.
- [ ] 11.0 **MVP Polish & Testing**
  - [ ] 11.1 Add comprehensive error handling and user feedback.
  - [ ] 11.2 Implement graceful disconnection/reconnection handling.
  - [ ] 11.3 End-to-end testing of create room → join → play → complete flow.
  - [ ] 11.4 Mobile responsiveness testing and touch target optimization.
  - [ ] 11.5 Performance testing and optimization (bundle size, rendering).
