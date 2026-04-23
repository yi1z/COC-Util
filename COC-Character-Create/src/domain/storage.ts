import { createAgeChoices, rollPrimaryAttributes } from './rules';
import type {
  InvestigatorDraft,
  SnapshotRecord,
  StorageEnvelopeV1,
  StepId,
  OccupationSetup,
  BackstoryProfile,
  EquipmentEntry,
  SkillDefinition,
  SkillAllocation,
} from './types';

const STORAGE_VERSION = '1.0';
const CURRENT_DRAFT_KEY = 'coc-character-create/current-draft';
const SNAPSHOTS_KEY = 'coc-character-create/snapshots';

const DEFAULT_OCCUPATION: OccupationSetup = {
  name: '自由调查员',
  formula: [{ attribute: 'EDU', multiplier: 4 }],
  creditRating: { min: 15, max: 75 },
  occupationalSkillIds: ['credit-rating', 'library-use', 'psychology', 'spot-hidden'],
};

const EMPTY_BACKSTORY: BackstoryProfile = {
  personalDescription: '',
  ideologyBeliefs: '',
  significantPeople: '',
  meaningfulLocations: '',
  treasuredPossessions: '',
  traits: '',
  injuriesScars: '',
  phobiasManias: '',
  arcaneTomesSpells: '',
  encounters: '',
  notes: '',
};

const EMPTY_EQUIPMENT: EquipmentEntry[] = [];
const EMPTY_CUSTOM_SKILLS: SkillDefinition[] = [];
const EMPTY_ALLOCATIONS: Record<string, SkillAllocation> = {};

const createId = (): string => globalThis.crypto.randomUUID();

const nowIso = (): string => new Date().toISOString();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const createFreshInvestigator = (): InvestigatorDraft => {
  const createdAt = nowIso();
  const { attributes, rolls } = rollPrimaryAttributes(26);

  return {
    id: createId(),
    createdAt,
    updatedAt: createdAt,
    profile: {
      investigatorName: '',
      playerName: '',
      age: 26,
      pronouns: '',
      residence: '',
      birthplace: '',
      occupation: '自由调查员',
      sex: '',
      era: '1920s',
    },
    rolledAttributes: attributes,
    attributeRolls: rolls,
    ageChoices: createAgeChoices(attributes, 26),
    occupation: { ...DEFAULT_OCCUPATION },
    backstory: { ...EMPTY_BACKSTORY },
    customSkills: [...EMPTY_CUSTOM_SKILLS],
    skillAllocations: { ...EMPTY_ALLOCATIONS },
    equipment: [...EMPTY_EQUIPMENT],
    currentStep: 'identity',
  };
};

export const touchDraft = <T extends InvestigatorDraft>(draft: T): T => ({
  ...draft,
  updatedAt: nowIso(),
});

export const serializeDraft = (draft: InvestigatorDraft): StorageEnvelopeV1 => ({
  version: STORAGE_VERSION,
  createdAt: draft.createdAt,
  updatedAt: draft.updatedAt,
  investigator: draft,
});

export const isStorageEnvelopeV1 = (value: unknown): value is StorageEnvelopeV1 => {
  if (!isRecord(value)) {
    return false;
  }

  return value.version === STORAGE_VERSION && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string' && isRecord(value.investigator);
};

const hasLocalStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const saveCurrentDraft = (draft: InvestigatorDraft): void => {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(serializeDraft(draft)));
};

export const loadCurrentDraft = (): InvestigatorDraft | null => {
  if (!hasLocalStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(CURRENT_DRAFT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isStorageEnvelopeV1(parsed)) {
      return null;
    }

    return parsed.investigator;
  } catch {
    return null;
  }
};

const loadSnapshotList = (): SnapshotRecord[] => {
  if (!hasLocalStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(SNAPSHOTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is SnapshotRecord => isRecord(entry) && typeof entry.id === 'string' && typeof entry.name === 'string' && typeof entry.savedAt === 'string' && isStorageEnvelopeV1(entry.envelope));
  } catch {
    return [];
  }
};

const writeSnapshotList = (snapshots: SnapshotRecord[]): void => {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
};

export const listSnapshots = (): SnapshotRecord[] => loadSnapshotList().sort((left, right) => right.savedAt.localeCompare(left.savedAt));

export const saveSnapshot = (draft: InvestigatorDraft, name?: string): SnapshotRecord => {
  const snapshot: SnapshotRecord = {
    id: createId(),
    name: name?.trim() || draft.profile.investigatorName.trim() || `未命名调查员 ${new Date().toLocaleString('zh-CN')}`,
    savedAt: nowIso(),
    envelope: serializeDraft(draft),
  };

  writeSnapshotList([snapshot, ...loadSnapshotList()]);
  return snapshot;
};

export const deleteSnapshot = (id: string): SnapshotRecord[] => {
  const next = loadSnapshotList().filter((snapshot) => snapshot.id !== id);
  writeSnapshotList(next);
  return next;
};

export const resetCurrentDraftStorage = (): void => {
  if (!hasLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(CURRENT_DRAFT_KEY);
};

export const parseImportedEnvelope = (raw: string): StorageEnvelopeV1 => {
  const parsed = JSON.parse(raw) as unknown;

  if (!isStorageEnvelopeV1(parsed)) {
    throw new Error('文件结构不是受支持的角色存档格式。');
  }

  return parsed;
};

export const cloneImportedDraft = (envelope: StorageEnvelopeV1): InvestigatorDraft => ({
  ...envelope.investigator,
  id: createId(),
  updatedAt: nowIso(),
});

export const stepOrder: StepId[] = ['identity', 'attributes', 'background', 'skills', 'finalize'];
