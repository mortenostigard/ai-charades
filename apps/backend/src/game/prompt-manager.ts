import { type GamePrompt } from '@charades/shared';

import { GAME_PROMPTS } from './data/prompts.js';

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
   * Gets a random prompt, preferring ones that haven't been used yet.
   * If every matching prompt has been used, wraps around and draws from
   * the full matching pool — a slight repeat risk is preferable to a
   * crash mid-game in long sessions.
   * @param category Optional category filter
   * @param difficulty Optional difficulty filter
   * @returns A random GamePrompt
   * @throws Error if no prompts match the requested filters at all
   */
  public getRandomPrompt(
    category?: GamePrompt['category'],
    difficulty?: GamePrompt['difficulty']
  ): GamePrompt {
    const matchesFilters = (prompt: GamePrompt) =>
      (!category || prompt.category === category) &&
      (!difficulty || prompt.difficulty === difficulty);

    const unused = GAME_PROMPTS.filter(
      p => !this.usedPromptIds.has(p.id) && matchesFilters(p)
    );
    const pool =
      unused.length > 0 ? unused : GAME_PROMPTS.filter(matchesFilters);

    if (pool.length === 0) {
      throw new Error('No prompts match the requested filters');
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const prompt = pool[randomIndex];
    if (!prompt) {
      throw new Error('No prompts match the requested filters');
    }
    return prompt;
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
