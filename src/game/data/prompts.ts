import { GamePrompt } from '@/types';

/**
 * A collection of game prompts organized by category and difficulty.
 * Each prompt has a unique ID, text to act out, category, and difficulty level.
 * These prompts focus on modern, relatable situations that are perfect for party charades.
 */
export const GAME_PROMPTS: GamePrompt[] = [
  // Modern Life Situations
  {
    id: 'modern_1',
    text: 'Trying to take the perfect selfie but everything goes wrong',
    category: 'modern_life',
    difficulty: 'easy',
  },
  {
    id: 'modern_2',
    text: "Having an argument with a smart home device that won't cooperate",
    category: 'modern_life',
    difficulty: 'medium',
  },
  {
    id: 'modern_3',
    text: 'Attempting to assemble IKEA furniture with missing pieces',
    category: 'modern_life',
    difficulty: 'medium',
  },
  {
    id: 'modern_4',
    text: 'Being stuck in an elevator with someone you have a crush on',
    category: 'modern_life',
    difficulty: 'easy',
  },
  {
    id: 'modern_5',
    text: 'Trying to eat soup on a first date without making a mess',
    category: 'modern_life',
    difficulty: 'easy',
  },
  {
    id: 'modern_6',
    text: 'Having a phone conversation while your WiFi keeps cutting out',
    category: 'modern_life',
    difficulty: 'medium',
  },
  {
    id: 'modern_7',
    text: 'Attempting to parallel park while people watch and judge',
    category: 'modern_life',
    difficulty: 'hard',
  },

  // Emotional/Psychological States
  {
    id: 'emotional_1',
    text: 'The internal struggle of wanting to text your ex at 2am',
    category: 'emotional',
    difficulty: 'medium',
  },
  {
    id: 'emotional_2',
    text: 'Pretending to understand what someone just explained to you',
    category: 'emotional',
    difficulty: 'easy',
  },
  {
    id: 'emotional_3',
    text: "The moment you realize you've been walking around with food in your teeth",
    category: 'emotional',
    difficulty: 'easy',
  },
  {
    id: 'emotional_4',
    text: 'Trying to look busy at work when you have nothing to do',
    category: 'emotional',
    difficulty: 'medium',
  },
  {
    id: 'emotional_5',
    text: "The panic of forgetting someone's name mid-conversation",
    category: 'emotional',
    difficulty: 'hard',
  },
  {
    id: 'emotional_6',
    text: 'Attempting to be mysterious and cool but failing',
    category: 'emotional',
    difficulty: 'medium',
  },
  {
    id: 'emotional_7',
    text: 'The realization that you left your phone at home',
    category: 'emotional',
    difficulty: 'easy',
  },

  // Social Media Behaviors
  {
    id: 'social_media_1',
    text: 'Crafting the perfect Instagram story to make your ex jealous',
    category: 'social_media',
    difficulty: 'medium',
  },
  {
    id: 'social_media_2',
    text: "Pretending to be interested in someone's 47th baby photo",
    category: 'social_media',
    difficulty: 'easy',
  },
  {
    id: 'social_media_3',
    text: "The internal debate of whether to like your crush's photo from 2019",
    category: 'social_media',
    difficulty: 'hard',
  },
  {
    id: 'social_media_4',
    text: 'Trying to take a candid photo but actually posing',
    category: 'social_media',
    difficulty: 'easy',
  },
  {
    id: 'social_media_5',
    text: 'Having a breakdown because your post only got 3 likes',
    category: 'social_media',
    difficulty: 'medium',
  },
  {
    id: 'social_media_6',
    text: "Stalking someone's social media and accidentally liking an old post",
    category: 'social_media',
    difficulty: 'hard',
  },

  // Social Situations
  {
    id: 'social_1',
    text: "Being the only person who doesn't get the inside joke",
    category: 'social_situations',
    difficulty: 'medium',
  },
  {
    id: 'social_2',
    text: 'Trying to pet a cat that clearly hates you',
    category: 'social_situations',
    difficulty: 'easy',
  },
  {
    id: 'social_3',
    text: 'Attempting to open a pickle jar with your dignity intact',
    category: 'social_situations',
    difficulty: 'medium',
  },
  {
    id: 'social_4',
    text: 'Being trapped in a conversation with someone who only talks about crypto',
    category: 'social_situations',
    difficulty: 'hard',
  },
  {
    id: 'social_5',
    text: "The awkward dance of walking toward someone but they're going the same direction",
    category: 'social_situations',
    difficulty: 'easy',
  },
  {
    id: 'social_6',
    text: 'Trying to eat a burrito without it falling apart',
    category: 'social_situations',
    difficulty: 'medium',
  },
  {
    id: 'social_7',
    text: 'Being the third wheel on what you thought was a group hangout',
    category: 'social_situations',
    difficulty: 'hard',
  },

  // Professional/Adult Life
  {
    id: 'professional_1',
    text: 'Pretending to understand your taxes',
    category: 'professional',
    difficulty: 'medium',
  },
  {
    id: 'professional_2',
    text: 'Trying to sound smart in a meeting about something you know nothing about',
    category: 'professional',
    difficulty: 'hard',
  },
  {
    id: 'professional_3',
    text: 'The panic of realizing you replied-all to a company email',
    category: 'professional',
    difficulty: 'easy',
  },
  {
    id: 'professional_4',
    text: "Attempting to network at a party when you're an introvert",
    category: 'professional',
    difficulty: 'medium',
  },
  {
    id: 'professional_5',
    text: 'Giving a presentation when the technology fails',
    category: 'professional',
    difficulty: 'hard',
  },
  {
    id: 'professional_6',
    text: 'Trying to remember where you parked your car',
    category: 'professional',
    difficulty: 'easy',
  },
  {
    id: 'professional_7',
    text: 'The awkwardness of running into your therapist at the grocery store',
    category: 'professional',
    difficulty: 'medium',
  },

  // Technology Struggles
  {
    id: 'technology_1',
    text: 'Explaining social media to your grandparents',
    category: 'technology',
    difficulty: 'medium',
  },
  {
    id: 'technology_2',
    text: 'Trying to look like you know how to use new technology',
    category: 'technology',
    difficulty: 'easy',
  },
  {
    id: 'technology_3',
    text: 'The rage of dealing with customer service chatbots',
    category: 'technology',
    difficulty: 'hard',
  },
  {
    id: 'technology_4',
    text: 'Attempting to take a group photo where everyone looks good',
    category: 'technology',
    difficulty: 'medium',
  },
  {
    id: 'technology_5',
    text: 'Fighting with autocorrect that keeps changing your words',
    category: 'technology',
    difficulty: 'easy',
  },
  {
    id: 'technology_6',
    text: 'Trying to charge your phone with a cord that only works at certain angles',
    category: 'technology',
    difficulty: 'medium',
  },

  // Abstract Concepts Made Physical
  {
    id: 'abstract_1',
    text: 'What Monday morning feels like as a person',
    category: 'abstract',
    difficulty: 'hard',
  },
  {
    id: 'abstract_2',
    text: 'Embodying the concept of "awkward silence"',
    category: 'abstract',
    difficulty: 'hard',
  },
  {
    id: 'abstract_3',
    text: "Being the physical manifestation of writer's block",
    category: 'abstract',
    difficulty: 'hard',
  },
  {
    id: 'abstract_4',
    text: 'Acting out what social anxiety looks like',
    category: 'abstract',
    difficulty: 'medium',
  },
  {
    id: 'abstract_5',
    text: 'Personifying the feeling of forgetting what you walked into a room for',
    category: 'abstract',
    difficulty: 'medium',
  },
  {
    id: 'abstract_6',
    text: 'Being the human version of a software update that no one wants',
    category: 'abstract',
    difficulty: 'hard',
  },
];
