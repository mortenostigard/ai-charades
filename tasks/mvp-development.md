# AI Charades: Director's Cut - Development Plan

This document outlines the tasks required to complete the Minimum Viable Product (MVP) over a 3-day development period.

- **Day 1:** Foundation, Planning, and Scaffolding
- **Day 2:** Backend Core, State Management, and Lobby Implementation
- **Day 3:** Core Game Loop, Gameplay Mechanics, and Polish

## Relevant Files

_This section will be populated as we create and modify files._

- `src/types/index.ts` - Centralized TypeScript interfaces for all game entities.
- `src/app/api/socket/route.ts` - Main Socket.io server endpoint for real-time communication.
- `src/lib/socket/handler.ts` - Server-side Socket.io event handlers and game logic.
- `src/stores/gameStore.ts` - Zustand store for global client-side state management.
- `src/hooks/useSocket.ts` - Custom hook to manage the client's Socket.io connection.
- `src/app/page.tsx` - The main home page component for creating or joining a room.
- `src/app/room/[code]/page.tsx` - The room lobby component where players wait before the game starts.

### Notes

- This plan focuses on building the core infrastructure. UI components will be implemented by referencing the examples in `/design-reference/screens`.
- Server-side logic will start with in-memory storage for simplicity, with the option to scale to Redis later.

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
- [ ] 6.0 **Implement Socket.io Server**
  - [ ] 6.1 Install `socket.io`.
  - [ ] 6.2 Create the initial server setup in `src/app/api/socket/route.ts`.
  - [ ] 6.3 Implement in-memory data structures for managing rooms and players.
  - [ ] 6.4 Implement `create-room`, `join-room`, and `leave-room` event handlers.
  - [ ] 6.5 Implement broadcasting for `player-joined` and `player-left` events to keep clients in sync.
  - [ ] 6.6 Add basic `room-error` event handling for scenarios like "room not found" or "room full".
- [ ] 7.0 **Build Client-Side State Management**
  - [ ] 7.1 Install `zustand` and `immer`.
  - [ ] 7.2 Create `src/stores/gameStore.ts` with the `GameState` interface and associated actions.
  - [ ] 7.3 Create the `useSocket` custom hook in `src/hooks/useSocket.ts` to initialize and manage the socket connection.
  - [ ] 7.4 Integrate the `useSocket` hook with the `gameStore` to update the client's state based on server events.
- [ ] 8.0 **Integrate Lobby Functionality**
  - [ ] 8.1 Create the application's entry point `src/app/page.tsx`, inspired by `design-reference/screens/home-page-screen.tsx`.
  - [ ] 8.2 Implement client-side logic for "Create Room" and "Join Room" buttons to emit socket events.
  - [ ] 8.3 Create the dynamic room page at `src/app/room/[code]/page.tsx` based on the lobby reference.
  - [ ] 8.4 Connect the lobby component to the `gameStore` to display the room code, player list, and host controls.
  - [ ] 8.5 Ensure the player list dynamically updates as `player-joined` and `player-left` events are received.

### Day 3: Game Loop & Polish

- [ ] 9.0 **Implement Core Game Flow Logic:** Wire up the round lifecycle, including role assignment, timers, and transitions between game views.
- [ ] 10.0 **Implement Gameplay Mechanics:** Handle sabotage deployment, audience guesses, and the scoring system.
- [ ] 11.0 **Finalize and Polish:** Implement the game-end sequence, add error handling, and conduct end-to-end testing.
