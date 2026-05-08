import { describe, it, expect } from 'vitest';

import { GAME_PROMPTS } from './data/prompts.js';
import { PromptManager } from './prompt-manager.js';

describe('PromptManager', () => {
  it('does not return a prompt that is already used', () => {
    const allButOne = GAME_PROMPTS.slice(0, GAME_PROMPTS.length - 1).map(
      p => p.id
    );
    const remaining = GAME_PROMPTS[GAME_PROMPTS.length - 1]!;
    const manager = new PromptManager(allButOne);

    for (let i = 0; i < 20; i++) {
      expect(manager.getRandomPrompt().id).toBe(remaining.id);
    }
  });

  it('wraps around to the full pool when every prompt has been used', () => {
    const allUsed = GAME_PROMPTS.map(p => p.id);
    const manager = new PromptManager(allUsed);

    const prompt = manager.getRandomPrompt();
    expect(GAME_PROMPTS.some(p => p.id === prompt.id)).toBe(true);
  });

  it('throws only when no prompts match the requested filters', () => {
    const manager = new PromptManager();
    const fakeCategory = 'does_not_exist' as never;
    expect(() => manager.getRandomPrompt(fakeCategory)).toThrow(
      'No prompts match the requested filters'
    );
  });

  it('filters by category when one is provided', () => {
    const manager = new PromptManager();
    for (let i = 0; i < 30; i++) {
      const prompt = manager.getRandomPrompt('modern_life');
      expect(prompt.category).toBe('modern_life');
    }
  });

  it('filters by difficulty when one is provided', () => {
    const manager = new PromptManager();
    for (let i = 0; i < 30; i++) {
      const prompt = manager.getRandomPrompt(undefined, 'hard');
      expect(prompt.difficulty).toBe('hard');
    }
  });

  it('filters by both category and difficulty', () => {
    const manager = new PromptManager();
    const haveCombo = GAME_PROMPTS.some(
      p => p.category === 'modern_life' && p.difficulty === 'easy'
    );
    if (!haveCombo) return;

    for (let i = 0; i < 30; i++) {
      const prompt = manager.getRandomPrompt('modern_life', 'easy');
      expect(prompt.category).toBe('modern_life');
      expect(prompt.difficulty).toBe('easy');
    }
  });

  it('returns a new manager instance from markPromptAsUsed without mutating the original', () => {
    const original = new PromptManager();
    expect(original.getUsedPromptIds()).toEqual([]);

    const updated = original.markPromptAsUsed('modern_1');
    expect(updated).not.toBe(original);
    expect(updated.getUsedPromptIds()).toEqual(['modern_1']);
    expect(original.getUsedPromptIds()).toEqual([]);
  });

  it('exposes the total prompt count', () => {
    expect(PromptManager.getTotalPromptCount()).toBe(GAME_PROMPTS.length);
  });

  it('counts prompts by category', () => {
    const counts = PromptManager.getPromptCountsByCategory();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(GAME_PROMPTS.length);
  });
});
