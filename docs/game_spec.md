# AI Charades: Director's Cut - Game Specification

## Core Concept

Traditional charades with a twist: one player acts while another player (the Director) can deploy sabotage actions to make the performance more challenging and entertaining.

## Setup

- **Players**: 3-8 people
- **Devices**: Two phones (Actor + Director)
- **Roles**: Actor, Director, Audience (everyone else)
- **Rotation**: Strict clockwise rotation ensuring equal director turns

## Round Structure

- **Total Duration**: 90 seconds
- **Grace Period**: First 20 seconds, no sabotage allowed
- **Sabotage Window**: 70 seconds where Director can deploy constraints
- **Prompts**: Movies, songs, celebrities, books (expandable categories)

## Sabotage Mechanics

- **Maximum Sabotages**: 3 per round
- **Duration**: Each sabotage lasts 20 seconds
- **Stacking**: Multiple sabotages can be active simultaneously (compatible ones only)
- **Notification**: Actor receives sound + vibration when sabotage deployed

### Sabotage Types

**Movement Constraints:**

- "Hop on one foot"
- "Only use left hand"
- "Can't use right arm"
- "Stay in one spot"
- "Everything in slow motion"

**Timing Disruptions:**

- "Freeze for 10 seconds"
- "Act in reverse"
- "Speed up dramatically"

**Style Impositions:**

- "Act like you're underwater"
- "You're terrified of everything"
- "Act like a robot"
- "Pretend you're elderly"

## Scoring System (Risk/Reward)

### If Someone Guesses Correctly:

- **Actor**: +2 points
- **Director**: -1 point per sabotage used
- **Correct Guesser**: +1 point

### If No One Guesses:

- **Director**: +2 points (successful sabotage)
- **Actor**: 0 points
- **Everyone else**: 0 points

## Strategic Considerations

- **Director's Dilemma**: More sabotage increases chance of preventing guess (+2 points) but risks bigger penalty if someone still guesses (-3 points max)
- **Actor Challenge**: Must adapt performance to overcome constraints
- **Audience Engagement**: Balance between guessing quickly vs. watching entertainment unfold

## Victory Conditions

- **Casual Play**: No fixed endpoint, play until group wants to stop
- **Competitive Play**: First to 10 points or most points after equal director turns
- **Session Play**: 20-30 minutes with score tracking

## Special Rules

- **Sabotage Compatibility**: Only deploy sabotages that can work together
- **Honor System**: Group enforces that actors follow sabotage constraints
- **Director Timing**: Cannot deploy sabotage during active constraint countdown
- **Equal Opportunity**: Game tracks that everyone gets equal director turns

## Game Flow Summary

1. **Home**: Player lands on the home screen to create or join a room.
2. **Lobby**: Players gather in the waiting room until the host starts the game.
3. **Role Assignment**: A transition screen shows each player their role for the round (Actor, Director, or Audience).
4. **Round Start**: The 90-second round begins.
   - **Grace Period**: Actor performs normally for the first 20 seconds.
   - **Sabotage Phase**: Director can deploy constraints for the remaining 70 seconds.
5. **Resolution**: Round ends on a correct guess or timeout.
6. **Round Summary**: Scores are awarded and displayed based on the outcome.
7. **Rotation**: Roles shift for the next round, returning to step 3.
