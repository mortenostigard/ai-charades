# Requirements

Source of truth for system behaviour rules. Requirements are written in EARS (Easy Approach to Requirements Syntax) and grouped by user-facing objective. Each acceptance criterion has a stable id and links to the test(s) that verify it.

## Convention

### Structure

Each system has multiple **Requirements**, each of which states a user-facing **Objective** in user-story form and lists numbered **Acceptance Criteria** in EARS format:

```
### Requirement N: <Objective area>
**Objective:** As a <role>, I want <capability>, so that <benefit>.

**Acceptance Criteria:**
1. WHEN <event> THEN <subject> SHALL <response>
2. IF <precondition> THEN <subject> SHALL <response>
3. WHILE <ongoing condition> THE <subject> SHALL <continuous behaviour>
4. WHERE <context> THE <subject> SHALL <contextual behaviour>
```

### EARS keywords

- **WHEN … THEN … SHALL …** — event-driven.
- **IF … THEN … SHALL …** — unwanted behaviour or precondition.
- **WHILE … THE … SHALL …** — state-driven, continuous.
- **WHERE … THE … SHALL …** — feature- or context-driven.
- Combine with **AND** for compound conditions.

### Phrasing rules

- Phrase at the domain level. Don't reference event names, internal state field names, error codes, or formulas — those are implementation. The requirement should make sense to a player or a non-engineer.
- Pick a concrete subject (e.g. "the Director", "the Actor's device", "every player in the round", "the system") rather than a generic one.

### Test linkage

- Acceptance criteria are identified by `<SYSTEM>-N.M` (e.g. `SAB-2.3`).
- Tests link to a criterion by including the id at the start of the `it(...)` description:

  ```ts
  it('SAB-2.3 rejects deploy when no round is active', () => { ... });
  ```

- A test may cite multiple ids (space-separated) when it covers more than one criterion.
- Find tests for a criterion: `grep -rn 'SAB-2.3' apps/ packages/`.
- A criterion with no matching grep result is **uncovered** — surface in PRs as a known gap or add a test.
- Tests without an id are allowed; they guard implementation details, not specified behaviour.

## Reserved id ranges

| System | Range       | Description                                                                    |
| ------ | ----------- | ------------------------------------------------------------------------------ |
| ROOM   | `ROOM-*.*`  | Rooms, player sessions, lobby, reconnection                                    |
| ROUND  | `ROUND-*.*` | Round lifecycle, role rotation, server-authoritative timer, director's verdict |
| SAB    | `SAB-*.*`   | Sabotage                                                                       |
| SCORE  | `SCORE-*.*` | Per-round scoring, end-of-game bonuses                                         |
| NET    | `NET-*.*`   | Socket.IO event contract, client state mirror, connection lifecycle            |

---

## SAB — Sabotage

The Director can disrupt the Actor's performance during a round by deploying short-lived sabotages, adding tactical depth and audience entertainment.

### Requirement 1: Director's Hand

**Objective:** As the Director, I want a curated hand of sabotage options at the start of each round, so that my choices feel deliberate rather than scrolling through a long catalogue mid-performance.

**Acceptance Criteria:**

1. **SAB-1.1** — WHEN a round starts THEN the Director SHALL receive a hand of 6 sabotages drawn at random from the sabotage catalogue.

### Requirement 2: Deploying a Sabotage

**Objective:** As the Director, I want to deploy a sabotage during my turn, so that I can challenge the Actor's performance and entertain the audience.

**Acceptance Criteria:**

1. **SAB-2.1** — WHEN the Director chooses a sabotage from their hand THEN the system SHALL deploy it.
2. **SAB-2.2** — IF a player who is not the Director attempts to deploy a sabotage THEN the system SHALL reject the attempt.
3. **SAB-2.3** — IF a sabotage is deployed while no round is active THEN the system SHALL reject the attempt.
4. **SAB-2.4** — IF a sabotage that does not exist in the catalogue is deployed THEN the system SHALL reject the attempt.
5. **SAB-2.5** — WHEN a deployment is rejected THEN the Director SHALL be told why.

### Requirement 3: Constraining Sabotage Use

**Objective:** As a player, I want sabotages to be a scarce, paced resource, so that the round doesn't devolve into nonstop disruption and the Actor has breathing room to perform.

**Acceptance Criteria:**

1. **SAB-3.1** — WHILE a round is in its first 20 seconds (the grace period) THE system SHALL reject any sabotage deployment.
2. **SAB-3.2** — WHILE a sabotage is active THE system SHALL reject any further sabotage deployment.
3. **SAB-3.3** — WHILE a round is in progress THE system SHALL allow no more than 3 sabotage deployments in total.

### Requirement 4: Sabotage Lifetime

**Objective:** As a player, I want each sabotage to last a fixed, predictable time, so that the Actor can adapt and the round stays paced.

**Acceptance Criteria:**

1. **SAB-4.1** — WHEN a sabotage is deployed THEN it SHALL remain in effect for 20 seconds.
2. **SAB-4.2** — WHEN a sabotage's 20 seconds elapse THEN the system SHALL end it.
3. **SAB-4.3** — IF a round ends while a sabotage is active THEN the sabotage SHALL end with the round.

### Requirement 5: Player Notifications

**Objective:** As a player in the round, I want to know when sabotages start and end, so that I can follow what the Actor is dealing with and react accordingly.

**Acceptance Criteria:**

1. **SAB-5.1** — WHEN a sabotage is deployed THEN every player in the round SHALL be notified of which sabotage was deployed and which player it targets.
2. **SAB-5.2** — WHEN a sabotage is deployed against the Actor THEN the Actor's device SHALL play an audible alert.
3. **SAB-5.3** — WHEN a sabotage ends THEN every player in the round SHALL be notified.

### Requirement 6: Sabotage Catalogue

**Objective:** As a player, I want a varied catalogue of sabotages, so that rounds don't feel repetitive across a game session.

**Acceptance Criteria:**

1. **SAB-6.1** — Every sabotage in the catalogue SHALL last 20 seconds.
2. **SAB-6.2** — The catalogue SHALL include sabotages from six distinct categories: emotion, physical, environment, character, sensory, meta.

---

## ROOM — Rooms & player sessions

Rooms gather players for a game session. They support brief disconnections without ejecting players from in-progress games, and identity continuity so a returning player slots back into the same role.

### Requirement 1: Creating a Room

**Objective:** As a host, I want to create a room with a code I can share, so that my friends can join the same game.

**Acceptance Criteria:**

1. **ROOM-1.1** — WHEN a host creates a room THEN the system SHALL produce a 4-digit code that is not currently in use.
2. **ROOM-1.2** — WHEN a host creates a room THEN the host SHALL be added as the first player and the room SHALL start in the lobby.

### Requirement 2: Joining a Room

**Objective:** As a player, I want to join a friend's room with the code they share, so that we can play together.

**Acceptance Criteria:**

1. **ROOM-2.1** — WHEN a player joins a lobby with a valid code THEN the system SHALL add them to the room.
2. **ROOM-2.2** — IF a player joins with a code that does not match an existing room THEN the system SHALL reject the attempt.
3. **ROOM-2.3** — IF a player joins a room that already has 8 players THEN the system SHALL reject the attempt.
4. **ROOM-2.4** — IF a player joins a room with a name another player there is already using THEN the system SHALL reject the attempt regardless of letter casing.
5. **ROOM-2.5** — IF a player joins a room whose game has already started THEN the system SHALL reject the attempt.
6. **ROOM-2.6** — IF a player joins with a name shorter than 2 characters THEN the system SHALL reject the attempt.

### Requirement 3: Leaving a Room

**Objective:** As a player, I want to leave a room when I'm done, so that I'm no longer associated with the game.

**Acceptance Criteria:**

1. **ROOM-3.1** — WHEN a player leaves a room THEN the system SHALL remove them and their score.
2. **ROOM-3.2** — WHEN the last player leaves a room THEN the system SHALL clean up the room.

### Requirement 4: Host Privileges

**Objective:** As the host, I want to be the only one who can start the game, so that game flow doesn't fragment under multiple authorities.

**Acceptance Criteria:**

1. **ROOM-4.1** — IF a player who is not the host attempts to start the game or start the next round THEN the system SHALL reject the attempt.

### Requirement 5: Tolerating Brief Absences

**Objective:** As a player at a party, I want the system to tolerate my phone briefly dropping off (locking, walking away, taking a call), so that a 30-second absence doesn't kick me out of an in-progress game.

**Acceptance Criteria:**

1. **ROOM-5.1** — WHEN a player's connection drops THEN every other player in the room SHALL see them flagged as disconnected.
2. **ROOM-5.2** — WHILE a room is in the lobby AND a player has been disconnected for 30 seconds THE system SHALL remove them.
3. **ROOM-5.3** — WHILE a game is in progress THE system SHALL keep a disconnected player's slot for the duration of the game.
4. **ROOM-5.4** — WHEN a disconnected player reconnects to their room THEN the system SHALL restore them to their slot and update peers' view of their connection status without any further announcement.
5. **ROOM-5.5** — WHEN a game completes and the room returns to the lobby THEN any players still disconnected SHALL be removed.
6. **ROOM-5.6** — WHILE every player in a room has been disconnected for 30 minutes THE system SHALL clean up the room.

### Requirement 6: Identity Continuity

**Objective:** As a returning player, I want to come back as the same player, so that my score and slot are preserved and nobody else can impersonate me.

**Acceptance Criteria:**

1. **ROOM-6.1** — WHEN a player joins or creates a room THEN the system SHALL issue them a credential that proves their identity on subsequent reconnections.
2. **ROOM-6.2** — IF a player presents a credential that does not match the one issued to them THEN the system SHALL reject the connection.
3. **ROOM-6.3** — WHILE other players are connected to a room THE system SHALL never expose another player's identity credential to them.

## ROUND — Round lifecycle & timer

_Stub. To be migrated in a follow-up issue._

## SCORE — Scoring & game completion

_Stub. To be migrated in a follow-up issue._

## NET — Realtime protocol & state sync

_Stub. To be migrated in a follow-up issue._
