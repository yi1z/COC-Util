import { rollD100, rollDice, type RandomSource, defaultRandomSource } from './dice';
import { STANDARD_SKILLS } from './skills';
import {
  ATTRIBUTE_KEYS,
  PHYSICAL_PENALTY_KEYS,
  type AgeAdjustmentChoice,
  type AgeRuleSummary,
  type AttributeKey,
  type AttributeRollMap,
  type DerivedStats,
  type InvestigatorDraft,
  type PrimaryAttributes,
  type SkillAllocation,
  type SkillComputedValue,
  type SkillDefinition,
  type ValidationIssue,
} from './types';

const FLOOR = Math.floor;

export const createEmptyAttributes = (): PrimaryAttributes => ({
  STR: 50,
  CON: 50,
  SIZ: 50,
  DEX: 50,
  APP: 50,
  INT: 50,
  POW: 50,
  EDU: 50,
  LUK: 50,
});

export const createDefaultAgeChoices = (): AgeAdjustmentChoice => ({
  youthPenaltyTarget: 'SIZ',
  physicalPenaltyAllocation: {
    STR: 0,
    CON: 0,
    DEX: 0,
  },
  eduImprovementChecks: [],
  youthLuckBonusRolls: [],
});

export const getAgeRuleSummary = (age: number): AgeRuleSummary => {
  if (age <= 19) {
    return {
      eduImprovementChecks: 0,
      appPenalty: 0,
      movPenalty: 0,
      physicalPenaltyPool: 0,
      youthPenalty: true,
    };
  }

  if (age <= 39) {
    return {
      eduImprovementChecks: 1,
      appPenalty: 0,
      movPenalty: 0,
      physicalPenaltyPool: 0,
      youthPenalty: false,
    };
  }

  if (age <= 49) {
    return {
      eduImprovementChecks: 2,
      appPenalty: 0,
      movPenalty: 1,
      physicalPenaltyPool: 5,
      youthPenalty: false,
    };
  }

  if (age <= 59) {
    return {
      eduImprovementChecks: 3,
      appPenalty: 5,
      movPenalty: 2,
      physicalPenaltyPool: 10,
      youthPenalty: false,
    };
  }

  if (age <= 69) {
    return {
      eduImprovementChecks: 4,
      appPenalty: 10,
      movPenalty: 3,
      physicalPenaltyPool: 20,
      youthPenalty: false,
    };
  }

  if (age <= 79) {
    return {
      eduImprovementChecks: 4,
      appPenalty: 15,
      movPenalty: 4,
      physicalPenaltyPool: 40,
      youthPenalty: false,
    };
  }

  return {
    eduImprovementChecks: 4,
    appPenalty: 20,
    movPenalty: 5,
    physicalPenaltyPool: 80,
    youthPenalty: false,
  };
};

const calculateMovementBase = (attributes: PrimaryAttributes): number => {
  const { STR, DEX, SIZ } = attributes;
  if (STR < SIZ && DEX < SIZ) {
    return 7;
  }

  if (STR > SIZ && DEX > SIZ) {
    return 9;
  }

  return 8;
};

const calculateBuildAndDamageBonus = (attributes: PrimaryAttributes): { build: number; damageBonus: string } => {
  const total = attributes.STR + attributes.SIZ;
  if (total < 65) {
    return { build: -2, damageBonus: '-2' };
  }
  if (total < 85) {
    return { build: -1, damageBonus: '-1' };
  }
  if (total < 125) {
    return { build: 0, damageBonus: '0' };
  }
  if (total < 165) {
    return { build: 1, damageBonus: '+1D4' };
  }
  if (total < 205) {
    return { build: 2, damageBonus: '+1D6' };
  }
  if (total < 285) {
    return { build: 3, damageBonus: '+2D6' };
  }

  const extraSteps = FLOOR((total - 285) / 80) + 1;
  return { build: 3 + extraSteps, damageBonus: `+${extraSteps + 2}D6` };
};

const clamp = (value: number, min = 0, max = 99): number => Math.max(min, Math.min(max, value));

export const autoAllocatePhysicalPenalty = (pool: number, attributes: PrimaryAttributes): AgeAdjustmentChoice['physicalPenaltyAllocation'] => {
  const allocation = {
    STR: 0,
    CON: 0,
    DEX: 0,
  };

  if (pool <= 0) {
    return allocation;
  }

  const ranked = [...PHYSICAL_PENALTY_KEYS].sort((left, right) => attributes[right] - attributes[left]);

  for (let index = 0; index < pool; index += 1) {
    const key = ranked[index % ranked.length];
    allocation[key] += 1;
  }

  return allocation;
};

export const createAgeChoices = (
  attributes: PrimaryAttributes,
  age: number,
  random: RandomSource = defaultRandomSource,
): AgeAdjustmentChoice => {
  const ageRule = getAgeRuleSummary(age);
  const eduImprovementChecks = Array.from({ length: ageRule.eduImprovementChecks }, () => {
    const checkRoll = rollD100(random);
    const success = checkRoll > attributes.EDU;
    const gainRoll = random.int(1, 10);
    return {
      checkRoll,
      success,
      gainRoll,
      gain: success ? gainRoll : 0,
    };
  });

  const youthLuckBonusRolls = ageRule.youthPenalty
    ? [rollDice(3, 6, 5, 0, random, '青春幸运重投'), rollDice(3, 6, 5, 0, random, '青春幸运重投')]
        .map((entry) => entry.result)
    : [];

  return {
    youthPenaltyTarget: attributes.STR >= attributes.SIZ ? 'STR' : 'SIZ',
    physicalPenaltyAllocation: autoAllocatePhysicalPenalty(ageRule.physicalPenaltyPool, attributes),
    eduImprovementChecks,
    youthLuckBonusRolls,
  };
};

export const rollPrimaryAttributes = (
  age = 26,
  random: RandomSource = defaultRandomSource,
): { attributes: PrimaryAttributes; rolls: AttributeRollMap; ageChoices: AgeAdjustmentChoice } => {
  const rolls: AttributeRollMap = {
    STR: rollDice(3, 6, 5, 0, random, '力量'),
    CON: rollDice(3, 6, 5, 0, random, '体质'),
    SIZ: rollDice(2, 6, 5, 6, random, '体型'),
    DEX: rollDice(3, 6, 5, 0, random, '敏捷'),
    APP: rollDice(3, 6, 5, 0, random, '外貌'),
    INT: rollDice(2, 6, 5, 6, random, '智力'),
    POW: rollDice(3, 6, 5, 0, random, '意志'),
    EDU: rollDice(2, 6, 5, 6, random, '教育'),
    LUK: rollDice(3, 6, 5, 0, random, '幸运'),
  };

  const attributes = ATTRIBUTE_KEYS.reduce((result, key) => {
    result[key] = rolls[key].result;
    return result;
  }, {} as PrimaryAttributes);

  return {
    attributes,
    rolls,
    ageChoices: createAgeChoices(attributes, age, random),
  };
};

export const applyAgeAdjustments = (
  baseAttributes: PrimaryAttributes,
  age: number,
  ageChoices: AgeAdjustmentChoice,
): PrimaryAttributes => {
  const ageRule = getAgeRuleSummary(age);
  const adjusted: PrimaryAttributes = { ...baseAttributes };

  if (ageRule.youthPenalty) {
    adjusted.EDU = clamp(adjusted.EDU - 5);
    adjusted[ageChoices.youthPenaltyTarget] = clamp(adjusted[ageChoices.youthPenaltyTarget] - 5);

    if (ageChoices.youthLuckBonusRolls.length > 0) {
      adjusted.LUK = Math.max(baseAttributes.LUK, ...ageChoices.youthLuckBonusRolls);
    }
  }

  if (!ageRule.youthPenalty) {
    const eduBonus = ageChoices.eduImprovementChecks.reduce((sum, check) => sum + check.gain, 0);
    adjusted.EDU = clamp(adjusted.EDU + eduBonus);
  }

  adjusted.APP = clamp(adjusted.APP - ageRule.appPenalty);

  for (const key of PHYSICAL_PENALTY_KEYS) {
    adjusted[key] = clamp(adjusted[key] - ageChoices.physicalPenaltyAllocation[key]);
  }

  return adjusted;
};

export const deriveStats = (attributes: PrimaryAttributes, age: number): DerivedStats => {
  const buildAndDamage = calculateBuildAndDamageBonus(attributes);
  const ageRule = getAgeRuleSummary(age);
  return {
    hp: Math.ceil((attributes.CON + attributes.SIZ) / 10),
    mp: FLOOR(attributes.POW / 5),
    san: attributes.POW,
    mov: Math.max(1, calculateMovementBase(attributes) - ageRule.movPenalty),
    dodge: FLOOR(attributes.DEX / 2),
    build: buildAndDamage.build,
    damageBonus: buildAndDamage.damageBonus,
    occupationPoints: 0,
    interestPoints: attributes.INT * 2,
  };
};

export const evaluateOccupationPoints = (
  attributes: PrimaryAttributes,
  formula: InvestigatorDraft['occupation']['formula'],
): number => formula.reduce((sum, term) => sum + attributes[term.attribute] * term.multiplier, 0);

export const getSkillCatalog = (customSkills: SkillDefinition[] = []): SkillDefinition[] => [...STANDARD_SKILLS, ...customSkills];

export const resolveSkillBase = (skill: SkillDefinition, attributes: PrimaryAttributes): number => {
  if (skill.base.kind === 'fixed') {
    return skill.base.value;
  }

  if (skill.base.source === 'DEX_HALF') {
    return FLOOR(attributes.DEX / 2);
  }

  return attributes.EDU;
};

export const computeSkillTotals = (
  skills: SkillDefinition[],
  allocations: Record<string, SkillAllocation>,
  attributes: PrimaryAttributes,
): Record<string, SkillComputedValue> =>
  skills.reduce<Record<string, SkillComputedValue>>((result, skill) => {
    const allocation = allocations[skill.id] ?? {
      skillId: skill.id,
      occupation: 0,
      interest: 0,
      extra: 0,
    };
    const base = resolveSkillBase(skill, attributes);
    result[skill.id] = {
      base,
      occupation: allocation.occupation,
      interest: allocation.interest,
      extra: allocation.extra,
      total: base + allocation.occupation + allocation.interest + allocation.extra,
    };
    return result;
  }, {});

export const createEmptyAllocation = (skillId: string): SkillAllocation => ({
  skillId,
  occupation: 0,
  interest: 0,
  extra: 0,
});

export const validateInvestigator = (draft: InvestigatorDraft): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const adjustedAttributes = applyAgeAdjustments(draft.rolledAttributes, draft.profile.age, draft.ageChoices);
  const ageRule = getAgeRuleSummary(draft.profile.age);
  const skills = getSkillCatalog(draft.customSkills);
  const totals = computeSkillTotals(skills, draft.skillAllocations, adjustedAttributes);
  const occupationPoints = evaluateOccupationPoints(adjustedAttributes, draft.occupation.formula);
  const spentOccupation = Object.values(draft.skillAllocations).reduce((sum, skill) => sum + skill.occupation, 0);
  const spentInterest = Object.values(draft.skillAllocations).reduce((sum, skill) => sum + skill.interest, 0);
  const interestPoints = adjustedAttributes.INT * 2;
  const creditRating = totals['credit-rating']?.total ?? 0;
  const physicalPenaltySpent = Object.values(draft.ageChoices.physicalPenaltyAllocation).reduce((sum, value) => sum + value, 0);

  if (!draft.profile.investigatorName.trim()) {
    issues.push({ id: 'name-required', level: 'warning', message: '调查员姓名尚未填写。' });
  }

  if (!draft.profile.occupation.trim()) {
    issues.push({ id: 'occupation-required', level: 'warning', message: '职业名称尚未填写。' });
  }

  if (draft.profile.age <= 0) {
    issues.push({ id: 'age-invalid', level: 'error', message: '年龄必须大于 0。' });
  }

  if (physicalPenaltySpent !== ageRule.physicalPenaltyPool) {
    issues.push({
      id: 'age-physical-penalty',
      level: 'warning',
      message: `当前年龄需要分配 ${ageRule.physicalPenaltyPool} 点体能衰退，现已分配 ${physicalPenaltySpent} 点。`,
    });
  }

  if (spentOccupation > occupationPoints) {
    issues.push({
      id: 'occupation-over',
      level: 'error',
      message: `职业点超支 ${spentOccupation - occupationPoints} 点。`,
    });
  }

  if (spentInterest > interestPoints) {
    issues.push({
      id: 'interest-over',
      level: 'error',
      message: `兴趣点超支 ${spentInterest - interestPoints} 点。`,
    });
  }

  if (creditRating < draft.occupation.creditRating.min || creditRating > draft.occupation.creditRating.max) {
    issues.push({
      id: 'credit-rating-range',
      level: 'warning',
      message: `信用评级应在 ${draft.occupation.creditRating.min}-${draft.occupation.creditRating.max} 之间，当前为 ${creditRating}。`,
    });
  }

  const illegalOccupation = Object.values(draft.skillAllocations).some(
    (allocation) => allocation.occupation > 0 && !draft.occupation.occupationalSkillIds.includes(allocation.skillId),
  );

  if (illegalOccupation) {
    issues.push({
      id: 'occupation-skill-selection',
      level: 'warning',
      message: '存在职业点投入在未勾选的职业技能上。',
    });
  }

  return issues;
};
