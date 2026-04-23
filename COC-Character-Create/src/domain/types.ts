export const ATTRIBUTE_KEYS = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU', 'LUK'] as const;
export const OCCUPATION_ATTRIBUTE_KEYS = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU'] as const;
export const PHYSICAL_PENALTY_KEYS = ['STR', 'CON', 'DEX'] as const;
export const STEP_IDS = ['identity', 'attributes', 'background', 'skills', 'finalize'] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];
export type OccupationAttributeKey = (typeof OCCUPATION_ATTRIBUTE_KEYS)[number];
export type PhysicalPenaltyKey = (typeof PHYSICAL_PENALTY_KEYS)[number];
export type StepId = (typeof STEP_IDS)[number];

export type PrimaryAttributes = Record<AttributeKey, number>;
export type AttributeRollMap = Record<AttributeKey, DiceRoll>;
export type SkillCategory =
  | '交涉'
  | '知识'
  | '行动'
  | '战斗'
  | '探索'
  | '专业'
  | '自定义';
export type EquipmentCategory = 'weapon' | 'gear' | 'book' | 'cash' | 'custom';
export type SkillBase =
  | { kind: 'fixed'; value: number }
  | { kind: 'derived'; source: 'DEX_HALF' | 'EDU' };

export interface DiceRoll {
  label: string;
  formula: string;
  rolls: number[];
  modifier?: number;
  result: number;
}

export interface DerivedStats {
  hp: number;
  mp: number;
  san: number;
  mov: number;
  dodge: number;
  build: number;
  damageBonus: string;
  occupationPoints: number;
  interestPoints: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
  base: SkillBase;
  summary?: string;
  custom?: boolean;
}

export interface SkillAllocation {
  skillId: string;
  occupation: number;
  interest: number;
  extra: number;
}

export interface OccupationFormulaTerm {
  attribute: OccupationAttributeKey;
  multiplier: number;
}

export interface OccupationSetup {
  name: string;
  formula: OccupationFormulaTerm[];
  creditRating: {
    min: number;
    max: number;
  };
  occupationalSkillIds: string[];
}

export interface AgeImprovementCheck {
  checkRoll: number;
  success: boolean;
  gainRoll: number;
  gain: number;
}

export interface AgeAdjustmentChoice {
  youthPenaltyTarget: 'STR' | 'SIZ';
  physicalPenaltyAllocation: Record<PhysicalPenaltyKey, number>;
  eduImprovementChecks: AgeImprovementCheck[];
  youthLuckBonusRolls: number[];
}

export interface IdentityProfile {
  investigatorName: string;
  playerName: string;
  age: number;
  pronouns: string;
  residence: string;
  birthplace: string;
  occupation: string;
  sex: string;
  era: string;
}

export interface BackstoryProfile {
  personalDescription: string;
  ideologyBeliefs: string;
  significantPeople: string;
  meaningfulLocations: string;
  treasuredPossessions: string;
  traits: string;
  injuriesScars: string;
  phobiasManias: string;
  arcaneTomesSpells: string;
  encounters: string;
  notes: string;
}

export interface EquipmentEntry {
  id: string;
  name: string;
  detail: string;
  quantity: number;
  category: EquipmentCategory;
}

export interface InvestigatorDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  profile: IdentityProfile;
  rolledAttributes: PrimaryAttributes;
  attributeRolls: AttributeRollMap;
  ageChoices: AgeAdjustmentChoice;
  occupation: OccupationSetup;
  backstory: BackstoryProfile;
  customSkills: SkillDefinition[];
  skillAllocations: Record<string, SkillAllocation>;
  equipment: EquipmentEntry[];
  currentStep: StepId;
}

export interface StorageEnvelopeV1 {
  version: '1.0';
  createdAt: string;
  updatedAt: string;
  investigator: InvestigatorDraft;
}

export interface SnapshotRecord {
  id: string;
  name: string;
  savedAt: string;
  envelope: StorageEnvelopeV1;
}

export interface AgeRuleSummary {
  eduImprovementChecks: number;
  appPenalty: number;
  movPenalty: number;
  physicalPenaltyPool: number;
  youthPenalty: boolean;
}

export interface SkillComputedValue {
  base: number;
  occupation: number;
  interest: number;
  extra: number;
  total: number;
}

export interface ValidationIssue {
  id: string;
  level: 'warning' | 'error';
  message: string;
}
