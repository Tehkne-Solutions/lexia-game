import { describe, it, expect } from 'vitest';
import {
  buildDailyChallengeDefinition,
  getDailyChallengeStarMultiplier,
  isDailyChallengeTarget,
  getNextDailyChallengeTarget,
  getDailyChallengeType,
  DAILY_CHALLENGE_TYPES,
} from '@/game/dailyChallengeEngine';

describe('Daily Challenge Engine', () => {
  it('builds a consistent daily challenge definition for the given date', () => {
    const today = '2026-08-24';
    const challenge = buildDailyChallengeDefinition([], today);
    expect(challenge).toBeDefined();
    expect(challenge.date).toBe(today);
    expect(challenge.targets).toBeDefined();
    expect(Array.isArray(challenge.targets)).toBe(true);
    expect(challenge.targets.length).toBe(3);
    expect(challenge.targetKeys.length).toBe(3);
  });

  it('provides a star multiplier (x2) for challenge target letters before completion', () => {
    const today = '2026-08-24';
    const challenge = buildDailyChallengeDefinition([], today);
    const targetKey = challenge.targetKeys[0];
    if (targetKey) {
      expect(isDailyChallengeTarget(challenge, targetKey)).toBe(true);
      expect(getDailyChallengeStarMultiplier(challenge, targetKey)).toBe(2);
    }
  });

  it('determines challenge type correctly based on journey progress', () => {
    // Empty progress -> Letters stage
    const type = getDailyChallengeType([]);
    expect(type).toBe(DAILY_CHALLENGE_TYPES.LETTERS);
  });

  it('returns next pending target correctly', () => {
    const today = '2026-08-24';
    const challenge = {
      ...buildDailyChallengeDefinition([], today),
      progress: {},
    };
    const nextTarget = getNextDailyChallengeTarget(challenge);
    expect(nextTarget).toBeDefined();
    expect(nextTarget?.key).toBe(challenge.targets[0]?.key);
  });
});

