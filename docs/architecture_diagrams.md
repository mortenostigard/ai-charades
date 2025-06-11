# AI Charades: Director's Cut – Architecture Diagrams

Below are the core UML-style diagrams that give newcomers a fast, visual overview of the system. Each is written in Mermaid so it renders automatically in GitHub / modern Markdown viewers.

---

## 1. Domain Model (Class Diagram)

```mermaid
classDiagram
  class Player {
    +id: string
    +name: string
    +connectionStatus: enum
    +joinedAt: number
  }

  class Room {
    +code: string
    +status: waiting|playing|complete
    +createdAt: number
    +maxPlayers: number
  }

  class GameConfig {
    +roundDuration: number
    +gracePeriod: number
    +maxSabotages: number
  }

  class GameState {
    +scores: Map<playerId, number>
  }

  class CurrentRound {
    +number: number
    +actorId: string
    +directorId: string
    +startTime: number
    +duration: number
    +sabotagesDeployedCount: number
  }

  class CompletedRound {
    +roundNumber: number
    +outcome: RoundOutcome
    +completedAt: number
  }

  class GamePrompt {
    +id: string
    +text: string
    +category
    +difficulty
  }

  class SabotageAction {
    +id: string
    +name: string
    +duration: number
    +category
  }

  class ActiveSabotage {
    +deployedAt: number
    +endsAt: number
    +deployedBy: string
  }

  Room "1" -- "*" Player
  GameState "1" o-- Room
  GameState "0..1" o-- CurrentRound
  GameState "0..*" o-- CompletedRound
  GameState "1" o-- GameConfig
  CurrentRound --> GamePrompt
  CurrentRound "0..1" --> ActiveSabotage
  ActiveSabotage --> SabotageAction
```

---

## 2. Room & Round Lifecycle (Sequence Diagram)

```mermaid
sequenceDiagram
  participant HostClient as Host-Client
  participant AllClients
  participant Server
  participant GameLoop as GameLoopManager

  HostClient->>Server: create_room()
  Server-->>HostClient: room_created()

  HostClient->>Server: start_game()
  Server->>Server: RoundManager.startRound()
  Server->>GameLoop: createLoop()
  Server-->>AllClients: game_state_update()

  loop every second
    GameLoop-->>AllClients: timer_update()
  end

  HostClient->>Server: end_round(winnerId)
  Server->>Server: RoundManager.endRound()
  Server-->>AllClients: round_complete()

  alt More rounds
    HostClient->>Server: start_round()
    Server->>Server: RoundManager.startRound()
    Server-->>AllClients: game_state_update()
  else Game complete
    Server-->>AllClients: game_state_update(status=complete)
  end
```

---

## 3. Real-Time Socket Event Flow (Sequence Diagram)

```mermaid
sequenceDiagram
  participant Client as Frontend (useSocket)
  participant Server as Backend (SocketHandlers)
  participant Others as Other Clients

  Client->>Server: join_room()
  alt success
    Server-->>Client: room_joined()
    Server-->>Others: player_joined()
  else failure
    Server-->>Client: room_error()
  end

  Client->>Server: deploy_sabotage()
  Server->>Server: SabotageManager.validate()
  Server-->>Client: sabotage_deployed()
  Server-->>Others: sabotage_deployed()

  note over Server: after duration
  Server-->>All: sabotage_ended()
```

---

## 4. Front-End State Synchronisation Pipeline (Component Diagram)

```mermaid
flowchart TD
  subgraph "Frontend"
    A["Socket.IO Client"]
    B["useSocket hook"]
    C["Zustand gameStore"]
    D["React UI Components"]
  end

  A --> B
  B --> C
  C --> D
  D -- "UI actions" --> B
  C -- "selectors" --> D
  B -- "socket.emit" --> A
```
