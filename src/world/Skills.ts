/**
 * Skills are plain inspection data for now: a number per trade, rolled once at
 * spawn and never touched by the simulation. Nothing consumes them yet — they
 * exist so the panel has something true to show, and so "who is good at what"
 * is a question the player can already ask.
 */
export const SKILLS = ["lumberjacking", "mining", "building", "farming", "cooking"] as const;

export type SkillName = (typeof SKILLS)[number];

export type SkillSet = Readonly<Record<SkillName, number>>;

export const MAX_SKILL_LEVEL = 10;

/**
 * Triangular-ish roll: averaging two samples clusters citizens around the middle
 * and makes a 9 or a 1 mean something. A flat roll would make every villager
 * look interchangeably lumpy.
 */
export function rollSkills(random: () => number): SkillSet {
  const set = {} as Record<SkillName, number>;
  for (const skill of SKILLS) {
    const roll = (random() + random()) / 2;
    set[skill] = Math.round(roll * MAX_SKILL_LEVEL);
  }
  return set;
}

/** The trade this citizen is most suited to — ties broken by declaration order. */
export function bestSkill(skills: SkillSet): SkillName {
  return SKILLS.reduce((best, skill) => (skills[skill] > skills[best] ? skill : best), SKILLS[0]);
}

export function worstSkill(skills: SkillSet): SkillName {
  return SKILLS.reduce((worst, skill) => (skills[skill] < skills[worst] ? skill : worst), SKILLS[0]);
}
