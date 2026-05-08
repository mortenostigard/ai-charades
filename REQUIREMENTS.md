# Requirements

Source of truth for system behaviour rules. Each requirement has a stable ID and is linked to one or more tests via the ID embedded in the test description. Changing a rule means: edit the requirement here, change the linked test, change the code to make it pass.

## Convention

- Requirements are identified by `<SYSTEM>-NNN` (e.g. `SAB-007`).
- Tests link to a requirement by including the ID at the start of the `it(...)` / `test(...)` description:

  ```ts
  it('SAB-007 rejects deploy past the per-round limit', () => { ... });
  ```

- A test may cite multiple IDs (space-separated) when it covers more than one rule.
- Find tests for a requirement: `grep -rn 'SAB-007' apps/ packages/`.
- A requirement with no matching grep result is **uncovered** — surface it in PRs as a known gap or add a test.
- Tests without an ID are allowed; they guard implementation details, not specified behaviour.
- EARS keywords used: `When` (event-driven), `While` (state-driven), `If … then` (unwanted behaviour), or unprefixed (ubiquitous).

## Reserved ID ranges

| System | Range            | Description                                                                    |
| ------ | ---------------- | ------------------------------------------------------------------------------ |
| ROOM   | `ROOM-001..099`  | Rooms, player sessions, lobby, reconnection                                    |
| ROUND  | `ROUND-001..099` | Round lifecycle, role rotation, server-authoritative timer, director's verdict |
| SAB    | `SAB-001..099`   | Sabotage                                                                       |
| SCORE  | `SCORE-001..099` | Per-round scoring, end-of-game bonuses                                         |
| NET    | `NET-001..099`   | Socket.IO event contract, client state mirror, connection lifecycle            |

---

## SAB — Sabotage

The Director can deploy short-lived constraints ("sabotages") on the Actor during a round. Sabotages are validated server-side, broadcast to all room sockets, and expire after a fixed duration.

### Round setup

- **SAB-001** — When a new round starts, the system shall assign the director an `availableSabotages` hand of 6 sabotages drawn at random from the master sabotage list.

### Authorization

- **SAB-002** — When handling `deploy_sabotage`, the system shall derive the director identity from the socket auth binding rather than from the event payload.
- **SAB-003** — If the requesting socket is not authenticated for the room, then the system shall emit `game_error` with code `UNAUTHORIZED` and not deploy.
- **SAB-004** — If a player who is not the current round's director attempts to deploy, then the system shall reject the request with `UNAUTHORIZED`.

### Round state preconditions

- **SAB-005** — If `deploy_sabotage` is received while no round is active (`currentRound` is null or `status` is `complete`), then the system shall reject the request with `ROUND_NOT_ACTIVE`.

### Grace period

- **SAB-006** — While the round is within its grace period (`deployTime − currentRound.startTime < gameConfig.gracePeriod`), the system shall reject any deploy with `GRACE_PERIOD_ACTIVE`.

### Per-round limit

- **SAB-007** — If `currentRound.sabotagesDeployedCount` has reached `gameConfig.maxSabotages`, then the system shall reject any further deploy with `MAX_SABOTAGES_REACHED`.

### No stacking

- **SAB-008** — While a sabotage is currently active (`currentRound.currentSabotage` is non-null), the system shall reject any deploy with `SABOTAGE_ALREADY_ACTIVE`.

### Lookup

- **SAB-009** — If the requested `sabotageId` is not present in the master sabotage list, then the system shall reject the request with `SABOTAGE_NOT_FOUND`.

### State transition on successful deploy

- **SAB-010** — When a sabotage is successfully deployed, the system shall set `currentRound.currentSabotage` with `deployedBy` = director id, `deployedAt` = deploy time, and `endsAt` = deploy time + `action.duration`.
- **SAB-011** — When a sabotage is successfully deployed, the system shall increment `currentRound.sabotagesDeployedCount` by 1.

### Broadcast on deploy

- **SAB-012** — When a sabotage is successfully deployed, the system shall broadcast `sabotage_deployed` to every socket in the room with the active sabotage and the actor's id as `targetPlayerId`.

### Expiry

- **SAB-013** — When a sabotage's duration elapses, if the same sabotage is still the current sabotage in the room, the system shall clear `currentRound.currentSabotage` and broadcast `sabotage_ended`.
- **SAB-014** — If the current sabotage has changed before the expiry timer fires (round ended, replaced), then the system shall not clear state or emit `sabotage_ended` for the original sabotage.

### Error reporting

- **SAB-015** — When a deploy fails with a known engine reason code, the system shall emit `sabotage_error` to the requesting socket carrying the reason code, a message, and the attempted sabotage id.

### Master list invariants

- **SAB-016** — Every entry in the master sabotage list shall have a `duration` of 20000 ms.
- **SAB-017** — The master sabotage list shall include at least one entry in each of the six `SabotageAction.category` values: `emotion`, `physical`, `environment`, `character`, `sensory`, `meta`.

### Actor notification

- **SAB-018** — When the actor's client receives a `sabotage_deployed` event addressed to them, the client shall play an audible alert.

---

## ROOM — Rooms & player sessions

_Stub. To be migrated in a follow-up issue._

## ROUND — Round lifecycle & timer

_Stub. To be migrated in a follow-up issue._

## SCORE — Scoring & game completion

_Stub. To be migrated in a follow-up issue._

## NET — Realtime protocol & state sync

_Stub. To be migrated in a follow-up issue._
