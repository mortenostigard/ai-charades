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

### If the Audience Guesses Correctly:

- **Actor**: +2 points
- **Director**: -1 point per sabotage used
- **Correct Guesser**: +1 point (as chosen by the Director)

### If No One Guesses Correctly (Timeout):

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

## Director's Verdict Mechanic

To keep players engaged with the performance and not their phones, guessing is verbal. The Director is responsible for judging the outcome.

- **Verbal Guessing**: Audience members shout their guesses as the Actor performs.
- **Director's Control**: When the Director hears the correct answer, they tap a `✅ Correct Guess` button on their screen.
- **Awarding a Correct Guess**:
  - Tapping the button prompts the Director to select the winning player from a list of audience members.
  - Confirming the winner ends the round immediately and triggers scoring.
- **Ending the Round Without a Winner**:
  - If the timer expires before a correct guess is confirmed, the round ends automatically.

## Game Flow Summary

1. **Home**: Player lands on the home screen to create or join a room.
2. **Lobby**: Players gather in the waiting room until the host starts the game.
3. **Role Assignment**: A transition screen shows each player their role for the round (Actor, Director, or Audience).
4. **Round Start**: The 90-second round begins.
   - **Grace Period**: Actor performs normally for the first 20 seconds.
   - **Sabotage Phase**: Director can deploy constraints for the remaining 70 seconds.
   - **Verbal Guessing**: Audience shouts guesses throughout the round.
5. **Resolution**: Round ends when the Director confirms a correct guess or the timer expires.
6. **Round Summary**: Scores are awarded and displayed based on the outcome.
7. **Rotation**: Roles shift for the next round, returning to step 3.

### End of Game

- The game concludes when each player has acted once
- The player with the highest total score is declared the winner.
- A final "Audience Favorite" bonus of +2 points is awarded to the player who received the most positive emoji reactions throughout the game while acting.
- A "Most Confusing" penalty of -2 points is given to the player who received the most negative emoji reactions.
