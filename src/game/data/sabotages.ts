import { SabotageAction } from '@/types';

/**
 * A collection of sabotage actions that the Director can deploy to make
 * the Actor's performance more challenging and entertaining.
 */
export const SABOTAGE_ACTIONS: SabotageAction[] = [
  // Emotion/Attitude Shifts
  {
    id: 'sabotage_emotion_1',
    name: 'Suddenly Polite',
    description: "Now you're extremely polite about it",
    duration: 20000,
    category: 'emotion',
    compatibleWith: [],
  },
  {
    id: 'sabotage_emotion_2',
    name: 'Slightly Annoyed',
    description: "Now you're slightly annoyed but trying to hide it",
    duration: 20000,
    category: 'emotion',
    compatibleWith: [],
  },
  {
    id: 'sabotage_emotion_3',
    name: "Mom's Watching",
    description: "Now you're doing it like you're being watched by your mom",
    duration: 20000,
    category: 'emotion',
    compatibleWith: [],
  },

  // Physical Style Changes
  {
    id: 'sabotage_physical_1',
    name: 'Slow Motion',
    description: 'Now everything is in slow motion',
    duration: 20000,
    category: 'physical',
    compatibleWith: [],
  },
  {
    id: 'sabotage_physical_2',
    name: 'Rubber Body',
    description: "Now you're doing it like you're made of rubber",
    duration: 20000,
    category: 'physical',
    compatibleWith: [],
  },
  {
    id: 'sabotage_physical_3',
    name: 'Moving Boat',
    description: "Now act like you're on a moving boat",
    duration: 20000,
    category: 'physical',
    compatibleWith: [],
  },

  // Environmental Shifts
  {
    id: 'sabotage_env_1',
    name: 'Earthquake',
    description: "Now you're doing this during an earthquake",
    duration: 20000,
    category: 'environment',
    compatibleWith: [],
  },
  {
    id: 'sabotage_env_2',
    name: 'High Winds',
    description: "Now it's incredibly windy",
    duration: 20000,
    category: 'environment',
    compatibleWith: [],
  },
  {
    id: 'sabotage_env_3',
    name: 'Floor is Lava',
    description: "Now the floor is lava (don't touch the ground)",
    duration: 20000,
    category: 'environment',
    compatibleWith: [],
  },
  {
    id: 'sabotage_env_4',
    name: 'Underwater',
    description: "Now you're underwater",
    duration: 20000,
    category: 'environment',
    compatibleWith: [],
  },

  // Character/Role Additions
  {
    id: 'sabotage_char_1',
    name: 'Learning Robot',
    description: "Now you're a robot learning to be human",
    duration: 20000,
    category: 'character',
    compatibleWith: [],
  },
  {
    id: 'sabotage_char_2',
    name: 'Theater Kid',
    description: "Now you're an overly dramatic theater actor",
    duration: 20000,
    category: 'character',
    compatibleWith: [],
  },
  {
    id: 'sabotage_char_3',
    name: 'Stealthy Ninja',
    description: "Now you're a ninja trying to stay hidden",
    duration: 20000,
    category: 'character',
    compatibleWith: [],
  },

  // Sensory Limitations
  {
    id: 'sabotage_sensory_1',
    name: 'Limp Arm',
    description: "Now one of your arms doesn't work properly",
    duration: 20000,
    category: 'sensory',
    compatibleWith: [],
  },
  {
    id: 'sabotage_sensory_2',
    name: 'Off Hand Only',
    description: "Now you can't use your dominant hand",
    duration: 20000,
    category: 'sensory',
    compatibleWith: [],
  },
  {
    id: 'sabotage_sensory_3',
    name: 'Eyes Closed',
    description: "Now you're doing it with your eyes closed",
    duration: 20000,
    category: 'sensory',
    compatibleWith: [],
  },
  {
    id: 'sabotage_sensory_4',
    name: 'Hiccups',
    description: "Now you have hiccups that won't stop",
    duration: 20000,
    category: 'sensory',
    compatibleWith: [],
  },

  // Meta/Absurd
  {
    id: 'sabotage_meta_1',
    name: 'Life or Death',
    description: "Now you're doing it like it's a life-or-death situation",
    duration: 20000,
    category: 'meta',
    compatibleWith: [],
  },
  {
    id: 'sabotage_meta_2',
    name: 'Existential Crisis',
    description: "Now you're doing it while having an existential crisis",
    duration: 20000,
    category: 'meta',
    compatibleWith: [],
  },
  {
    id: 'sabotage_meta_3',
    name: 'Infomercial',
    description: "Now you're doing it like you're in a commercial for it",
    duration: 20000,
    category: 'meta',
    compatibleWith: [],
  },
];
