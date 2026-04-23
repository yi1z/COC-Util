import {
  createContext,
  type Dispatch,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useState,
  type PropsWithChildren,
} from 'react';
import { OCCUPATION_FORMULA_PRESETS } from '../domain/skills';
import {
  applyAgeAdjustments,
  computeSkillTotals,
  createAgeChoices,
  createEmptyAllocation,
  deriveStats,
  evaluateOccupationPoints,
  getSkillCatalog,
  getAgeRuleSummary,
  rollPrimaryAttributes,
  validateInvestigator,
} from '../domain/rules';
import {
  cloneImportedDraft,
  createFreshInvestigator,
  deleteSnapshot as deleteSnapshotStorage,
  listSnapshots,
  loadCurrentDraft,
  parseImportedEnvelope,
  resetCurrentDraftStorage,
  saveCurrentDraft,
  saveSnapshot as saveSnapshotStorage,
  stepOrder,
  touchDraft,
} from '../domain/storage';
import type {
  AgeAdjustmentChoice,
  AttributeKey,
  BackstoryProfile,
  EquipmentCategory,
  EquipmentEntry,
  InvestigatorDraft,
  PhysicalPenaltyKey,
  SkillAllocation,
  SkillDefinition,
  SnapshotRecord,
  StepId,
} from '../domain/types';

type DraftAction =
  | { type: 'set-step'; step: StepId }
  | { type: 'update-profile'; field: keyof InvestigatorDraft['profile']; value: string | number }
  | { type: 'set-rolled-attribute'; key: AttributeKey; value: number }
  | { type: 'reroll-attribute'; key: AttributeKey }
  | { type: 'reroll-all' }
  | { type: 'refresh-age-adjustments' }
  | { type: 'set-youth-target'; target: AgeAdjustmentChoice['youthPenaltyTarget'] }
  | { type: 'set-physical-penalty'; key: PhysicalPenaltyKey; value: number }
  | { type: 'set-occupation-name'; value: string }
  | { type: 'set-credit-range'; bound: 'min' | 'max'; value: number }
  | { type: 'set-formula-preset'; presetId: string }
  | { type: 'set-formula-term'; index: number; field: 'attribute' | 'multiplier'; value: string | number }
  | { type: 'add-formula-term' }
  | { type: 'remove-formula-term'; index: number }
  | { type: 'toggle-occupational-skill'; skillId: string }
  | { type: 'update-backstory'; field: keyof BackstoryProfile; value: string }
  | { type: 'add-custom-skill'; name: string; base: number }
  | { type: 'remove-custom-skill'; skillId: string }
  | { type: 'update-skill-allocation'; skillId: string; field: keyof Omit<SkillAllocation, 'skillId'>; value: number }
  | { type: 'reset-skill-allocations' }
  | { type: 'add-equipment'; category: EquipmentCategory }
  | { type: 'update-equipment'; id: string; field: keyof EquipmentEntry; value: string | number }
  | { type: 'remove-equipment'; id: string }
  | { type: 'clear-draft' }
  | { type: 'replace-draft'; draft: InvestigatorDraft };

const clampNumber = (value: number, min = 0, max = 999): number => Math.max(min, Math.min(max, Number.isNaN(value) ? 0 : value));

const rerollSingleAttribute = (draft: InvestigatorDraft, key: AttributeKey): InvestigatorDraft => {
  const rerolled = rollPrimaryAttributes(draft.profile.age);
  const nextDraft = touchDraft({
    ...draft,
    rolledAttributes: {
      ...draft.rolledAttributes,
      [key]: rerolled.attributes[key],
    },
    attributeRolls: {
      ...draft.attributeRolls,
      [key]: rerolled.rolls[key],
    },
  });

  return {
    ...nextDraft,
    ageChoices: createAgeChoices(nextDraft.rolledAttributes, nextDraft.profile.age),
  };
};

const updateAgeSensitiveProfile = (draft: InvestigatorDraft, field: keyof InvestigatorDraft['profile'], value: string | number): InvestigatorDraft => {
  const next = touchDraft({
    ...draft,
    profile: {
      ...draft.profile,
      [field]: value,
    },
  });

  if (field !== 'age') {
    return next;
  }

  return {
    ...next,
    ageChoices: createAgeChoices(next.rolledAttributes, Number(value)),
  };
};

const draftReducer = (draft: InvestigatorDraft, action: DraftAction): InvestigatorDraft => {
  switch (action.type) {
    case 'set-step':
      return touchDraft({ ...draft, currentStep: action.step });
    case 'update-profile':
      return updateAgeSensitiveProfile(draft, action.field, action.value);
    case 'set-rolled-attribute':
      return touchDraft({
        ...draft,
        rolledAttributes: {
          ...draft.rolledAttributes,
          [action.key]: clampNumber(action.value, 0, 99),
        },
      });
    case 'reroll-attribute':
      return rerollSingleAttribute(draft, action.key);
    case 'reroll-all': {
      const rerolled = rollPrimaryAttributes(draft.profile.age);
      return touchDraft({
        ...draft,
        rolledAttributes: rerolled.attributes,
        attributeRolls: rerolled.rolls,
        ageChoices: rerolled.ageChoices,
      });
    }
    case 'refresh-age-adjustments':
      return touchDraft({
        ...draft,
        ageChoices: createAgeChoices(draft.rolledAttributes, draft.profile.age),
      });
    case 'set-youth-target':
      return touchDraft({
        ...draft,
        ageChoices: {
          ...draft.ageChoices,
          youthPenaltyTarget: action.target,
        },
      });
    case 'set-physical-penalty':
      return touchDraft({
        ...draft,
        ageChoices: {
          ...draft.ageChoices,
          physicalPenaltyAllocation: {
            ...draft.ageChoices.physicalPenaltyAllocation,
            [action.key]: clampNumber(action.value, 0, 99),
          },
        },
      });
    case 'set-occupation-name':
      return touchDraft({
        ...draft,
        profile: { ...draft.profile, occupation: action.value },
        occupation: { ...draft.occupation, name: action.value },
      });
    case 'set-credit-range':
      return touchDraft({
        ...draft,
        occupation: {
          ...draft.occupation,
          creditRating: {
            ...draft.occupation.creditRating,
            [action.bound]: clampNumber(action.value, 0, 99),
          },
        },
      });
    case 'set-formula-preset': {
      const preset = OCCUPATION_FORMULA_PRESETS.find((entry) => entry.id === action.presetId);
      if (!preset) {
        return draft;
      }

      return touchDraft({
        ...draft,
        occupation: {
          ...draft.occupation,
          formula: preset.formula,
        },
      });
    }
    case 'set-formula-term':
      return touchDraft({
        ...draft,
        occupation: {
          ...draft.occupation,
          formula: draft.occupation.formula.map((term, index) =>
            index === action.index
              ? {
                  ...term,
                  [action.field]:
                    action.field === 'multiplier' ? clampNumber(Number(action.value), 1, 6) : action.value,
                }
              : term,
          ),
        },
      });
    case 'add-formula-term':
      return touchDraft({
        ...draft,
        occupation: {
          ...draft.occupation,
          formula: [...draft.occupation.formula, { attribute: 'EDU', multiplier: 2 }],
        },
      });
    case 'remove-formula-term':
      return touchDraft({
        ...draft,
        occupation: {
          ...draft.occupation,
          formula: draft.occupation.formula.filter((_, index) => index !== action.index),
        },
      });
    case 'toggle-occupational-skill':
      return touchDraft({
        ...draft,
        occupation: {
          ...draft.occupation,
          occupationalSkillIds: draft.occupation.occupationalSkillIds.includes(action.skillId)
            ? draft.occupation.occupationalSkillIds.filter((skillId) => skillId !== action.skillId)
            : [...draft.occupation.occupationalSkillIds, action.skillId],
        },
      });
    case 'update-backstory':
      return touchDraft({
        ...draft,
        backstory: {
          ...draft.backstory,
          [action.field]: action.value,
        },
      });
    case 'add-custom-skill': {
      const trimmed = action.name.trim();
      if (!trimmed) {
        return draft;
      }

      const skillId = `custom-${trimmed.toLowerCase().replace(/\s+/g, '-')}-${globalThis.crypto.randomUUID().slice(0, 6)}`;
      return touchDraft({
        ...draft,
        customSkills: [
          ...draft.customSkills,
          {
            id: skillId,
            name: trimmed,
            category: '自定义',
            base: { kind: 'fixed', value: clampNumber(action.base, 0, 99) },
            custom: true,
          },
        ],
      });
    }
    case 'remove-custom-skill':
      return touchDraft({
        ...draft,
        customSkills: draft.customSkills.filter((skill) => skill.id !== action.skillId),
      });
    case 'update-skill-allocation':
      return touchDraft({
        ...draft,
        skillAllocations: {
          ...draft.skillAllocations,
          [action.skillId]: {
            ...(draft.skillAllocations[action.skillId] ?? createEmptyAllocation(action.skillId)),
            [action.field]: clampNumber(action.value, 0, 99),
          },
        },
      });
    case 'reset-skill-allocations':
      return touchDraft({
        ...draft,
        skillAllocations: {},
      });
    case 'add-equipment':
      return touchDraft({
        ...draft,
        equipment: [
          ...draft.equipment,
          {
            id: globalThis.crypto.randomUUID(),
            name: '',
            detail: '',
            quantity: 1,
            category: action.category,
          },
        ],
      });
    case 'update-equipment':
      return touchDraft({
        ...draft,
        equipment: draft.equipment.map((item) =>
          item.id === action.id
            ? {
                ...item,
                [action.field]:
                  action.field === 'quantity' ? clampNumber(Number(action.value), 0, 99) : action.value,
              }
            : item,
        ),
      });
    case 'remove-equipment':
      return touchDraft({
        ...draft,
        equipment: draft.equipment.filter((item) => item.id !== action.id),
      });
    case 'clear-draft':
      return createFreshInvestigator();
    case 'replace-draft':
      return touchDraft(action.draft);
    default:
      return draft;
  }
};

interface InvestigatorContextValue {
  draft: InvestigatorDraft;
  adjustedAttributes: ReturnType<typeof applyAgeAdjustments>;
  derivedStats: ReturnType<typeof deriveStats>;
  occupationPoints: number;
  interestPoints: number;
  spentOccupation: number;
  spentInterest: number;
  issues: ReturnType<typeof validateInvestigator>;
  skillCatalog: ReturnType<typeof getSkillCatalog>;
  skillTotals: ReturnType<typeof computeSkillTotals>;
  snapshots: SnapshotRecord[];
  deferredSnapshots: SnapshotRecord[];
  stepIndex: number;
  saveSnapshot: () => string;
  deleteSnapshot: (id: string) => void;
  loadSnapshot: (id: string) => void;
  exportJson: () => string;
  importJson: (raw: string) => void;
  clearDraft: () => void;
  setStep: (step: StepId) => void;
  goStep: (offset: number) => void;
  dispatch: Dispatch<DraftAction>;
}

const InvestigatorContext = createContext<InvestigatorContextValue | null>(null);

export const InvestigatorProvider = ({ children }: PropsWithChildren) => {
  const [draft, dispatch] = useReducer(draftReducer, undefined, () => loadCurrentDraft() ?? createFreshInvestigator());
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>(() => listSnapshots());
  const deferredSnapshots = useDeferredValue(snapshots);

  const adjustedAttributes = useMemo(
    () => applyAgeAdjustments(draft.rolledAttributes, draft.profile.age, draft.ageChoices),
    [draft.ageChoices, draft.profile.age, draft.rolledAttributes],
  );

  const skillCatalog = useMemo(() => getSkillCatalog(draft.customSkills), [draft.customSkills]);
  const skillTotals = useMemo(
    () => computeSkillTotals(skillCatalog, draft.skillAllocations, adjustedAttributes),
    [adjustedAttributes, draft.skillAllocations, skillCatalog],
  );

  const occupationPoints = useMemo(
    () => evaluateOccupationPoints(adjustedAttributes, draft.occupation.formula),
    [adjustedAttributes, draft.occupation.formula],
  );

  const interestPoints = useMemo(() => adjustedAttributes.INT * 2, [adjustedAttributes.INT]);
  const derivedStats = useMemo(() => {
    const stats = deriveStats(adjustedAttributes, draft.profile.age);
    return {
      ...stats,
      occupationPoints,
      interestPoints,
    };
  }, [adjustedAttributes, draft.profile.age, interestPoints, occupationPoints]);
  const spentOccupation = useMemo(
    () => Object.values(draft.skillAllocations).reduce((sum, skill) => sum + skill.occupation, 0),
    [draft.skillAllocations],
  );
  const spentInterest = useMemo(
    () => Object.values(draft.skillAllocations).reduce((sum, skill) => sum + skill.interest, 0),
    [draft.skillAllocations],
  );
  const issues = useMemo(() => validateInvestigator(draft), [draft]);
  const stepIndex = stepOrder.indexOf(draft.currentStep);

  const persistDraft = useEffectEvent((nextDraft: InvestigatorDraft) => {
    saveCurrentDraft(nextDraft);
  });

  useEffect(() => {
    persistDraft(draft);
  }, [draft, persistDraft]);

  const contextValue = useMemo<InvestigatorContextValue>(
    () => ({
      draft,
      adjustedAttributes,
      derivedStats,
      occupationPoints,
      interestPoints,
      spentOccupation,
      spentInterest,
      issues,
      skillCatalog,
      skillTotals,
      snapshots,
      deferredSnapshots,
      stepIndex,
      saveSnapshot: () => {
        const saved = saveSnapshotStorage(draft);
        setSnapshots(listSnapshots());
        return saved.name;
      },
      deleteSnapshot: (id) => {
        setSnapshots(deleteSnapshotStorage(id));
      },
      loadSnapshot: (id) => {
        const snapshot = snapshots.find((entry) => entry.id === id);
        if (!snapshot) {
          return;
        }

        startTransition(() => {
          dispatch({ type: 'replace-draft', draft: cloneImportedDraft(snapshot.envelope) });
        });
      },
      exportJson: () => JSON.stringify({ version: '1.0', createdAt: draft.createdAt, updatedAt: draft.updatedAt, investigator: draft }, null, 2),
      importJson: (raw) => {
        const envelope = parseImportedEnvelope(raw);
        startTransition(() => {
          dispatch({ type: 'replace-draft', draft: cloneImportedDraft(envelope) });
        });
      },
      clearDraft: () => {
        resetCurrentDraftStorage();
        startTransition(() => {
          dispatch({ type: 'clear-draft' });
        });
      },
      setStep: (step) => {
        startTransition(() => {
          dispatch({ type: 'set-step', step });
        });
      },
      goStep: (offset) => {
        const nextIndex = Math.min(stepOrder.length - 1, Math.max(0, stepIndex + offset));
        startTransition(() => {
          dispatch({ type: 'set-step', step: stepOrder[nextIndex] });
        });
      },
      dispatch,
    }),
    [
      adjustedAttributes,
      deferredSnapshots,
      derivedStats,
      draft,
      interestPoints,
      issues,
      occupationPoints,
      skillCatalog,
      skillTotals,
      snapshots,
      spentInterest,
      spentOccupation,
      stepIndex,
    ],
  );

  return <InvestigatorContext.Provider value={contextValue}>{children}</InvestigatorContext.Provider>;
};

export const useInvestigator = (): InvestigatorContextValue => {
  const context = useContext(InvestigatorContext);
  if (!context) {
    throw new Error('useInvestigator must be used inside InvestigatorProvider');
  }

  return context;
};

export const useAgeRule = (age: number) => getAgeRuleSummary(age);
