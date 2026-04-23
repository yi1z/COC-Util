import { describe, expect, it } from 'vitest';
import { applyAgeAdjustments, createAgeChoices, deriveStats, getAgeRuleSummary, rollPrimaryAttributes } from './rules';
import type { RandomSource } from './dice';
import type { PrimaryAttributes } from './types';

const createSequenceRandom = (sequence: number[]): RandomSource => {
  let index = 0;
  return {
    int(min, max) {
      const value = sequence[index] ?? min;
      index += 1;
      return Math.max(min, Math.min(max, value));
    },
  };
};

describe('rules', () => {
  it('rollPrimaryAttributes generates values in expected ranges', () => {
    const result = rollPrimaryAttributes(26, createSequenceRandom([3, 3, 3, 4, 4, 4, 5, 5, 1, 2, 3, 6, 6, 6, 2, 2, 6, 6, 1, 1, 1]));

    expect(result.attributes.STR).toBeGreaterThanOrEqual(15);
    expect(result.attributes.STR).toBeLessThanOrEqual(90);
    expect(result.attributes.SIZ).toBeGreaterThanOrEqual(40);
    expect(result.attributes.EDU).toBeLessThanOrEqual(90);
    expect(result.rolls.STR.rolls).toHaveLength(3);
    expect(result.ageChoices.eduImprovementChecks).toHaveLength(1);
  });

  it('applyAgeAdjustments uses youth penalties and luck replacement', () => {
    const base: PrimaryAttributes = {
      STR: 60,
      CON: 55,
      SIZ: 50,
      DEX: 70,
      APP: 65,
      INT: 80,
      POW: 55,
      EDU: 60,
      LUK: 45,
    };

    const adjusted = applyAgeAdjustments(base, 18, {
      youthPenaltyTarget: 'STR',
      physicalPenaltyAllocation: { STR: 0, CON: 0, DEX: 0 },
      eduImprovementChecks: [],
      youthLuckBonusRolls: [35, 70],
    });

    expect(adjusted.STR).toBe(55);
    expect(adjusted.EDU).toBe(55);
    expect(adjusted.LUK).toBe(70);
  });

  it('deriveStats returns stable boundary values', () => {
    const stats = deriveStats(
      {
        STR: 65,
        CON: 55,
        SIZ: 70,
        DEX: 60,
        APP: 50,
        INT: 80,
        POW: 45,
        EDU: 75,
        LUK: 40,
      },
      52,
    );

    expect(stats.hp).toBe(13);
    expect(stats.mp).toBe(9);
    expect(stats.mov).toBe(5);
    expect(stats.dodge).toBe(30);
    expect(stats.damageBonus).toBe('+1D4');
  });

  it('createAgeChoices auto allocates penalties for older investigators', () => {
    const base: PrimaryAttributes = {
      STR: 80,
      CON: 70,
      SIZ: 55,
      DEX: 65,
      APP: 50,
      INT: 65,
      POW: 55,
      EDU: 60,
      LUK: 50,
    };
    const choices = createAgeChoices(base, 64, createSequenceRandom([88, 5, 91, 4, 96, 7, 99, 2]));
    expect(getAgeRuleSummary(64).physicalPenaltyPool).toBe(20);
    expect(Object.values(choices.physicalPenaltyAllocation).reduce((sum, value) => sum + value, 0)).toBe(20);
    expect(choices.eduImprovementChecks).toHaveLength(4);
  });
});
