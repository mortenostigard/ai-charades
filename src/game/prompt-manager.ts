import { GamePrompt } from '@/types';

import { GAME_PROMPTS } from './data/prompts';

/**
 * Manages game prompts, ensuring variety and preventing repetition.
 * This class is designed to be stateless and pure, taking the current state
 * and returning a new state without side effects.
 */
export class PromptManager {
  private readonly usedPromptIds: Set<string>;

  constructor(usedPromptIds: string[] = []) {
    this.usedPromptIds = new Set(usedPromptIds);
  }

  /**
   * Gets a random prompt that hasn't been used yet.
   * @param category Optional category filter
   * @param difficulty Optional difficulty filter
   * @returns A random GamePrompt that hasn't been used
   * @throws Error if no unused prompts are available
   */
  public getRandomPrompt(
    category?: GamePrompt['category'],
    difficulty?: GamePrompt['difficulty']
  ): GamePrompt {
    const availablePrompts = GAME_PROMPTS.filter(
      prompt =>
        !this.usedPromptIds.has(prompt.id) &&
        (!category || prompt.category === category) &&
        (!difficulty || prompt.difficulty === difficulty)
    );

    if (availablePrompts.length === 0) {
      throw new Error('No unused prompts available');
    }

    const randomIndex = Math.floor(Math.random() * availablePrompts.length);
    return availablePrompts[randomIndex];
  }

  /**
   * Gets a new prompt manager with the given prompt marked as used.
   * @param promptId The ID of the prompt to mark as used
   * @returns A new PromptManager instance with updated used prompts
   */
  public markPromptAsUsed(promptId: string): PromptManager {
    const newUsedPromptIds = new Set(this.usedPromptIds);
    newUsedPromptIds.add(promptId);
    return new PromptManager(Array.from(newUsedPromptIds));
  }

  /**
   * Gets the list of all used prompt IDs.
   * @returns Array of used prompt IDs
   */
  public getUsedPromptIds(): string[] {
    return Array.from(this.usedPromptIds);
  }

  /**
   * Gets the total number of available prompts.
   * @returns The total count of prompts in the game
   */
  public static getTotalPromptCount(): number {
    return GAME_PROMPTS.length;
  }

  /**
   * Gets the count of prompts by category.
   * @returns Record of category to count
   */
  public static getPromptCountsByCategory(): Record<
    GamePrompt['category'],
    number
  > {
    return GAME_PROMPTS.reduce(
      (acc, prompt) => {
        acc[prompt.category] = (acc[prompt.category] || 0) + 1;
        return acc;
      },
      {} as Record<GamePrompt['category'], number>
    );
  }
}
