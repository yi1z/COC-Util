import { STEP_IDS, type StepId } from '../domain/types';
import styles from '../styles/workspace.module.css';

const STEP_COPY: Record<
  StepId,
  {
    index: string;
    title: string;
    description: string;
  }
> = {
  identity: {
    index: 'Step 01',
    title: '基础设定',
    description: '先定调查员的年代、身份和建卡基调。',
  },
  attributes: {
    index: 'Step 02',
    title: '属性生成',
    description: '投出核心属性，处理年龄修正，并允许单项微调。',
  },
  background: {
    index: 'Step 03',
    title: '身份与背景',
    description: '补完人物轮廓、信念、伤痕与调查动机。',
  },
  skills: {
    index: 'Step 04',
    title: '职业与技能点',
    description: '设定职业公式、勾选职业技能并分配点数。',
  },
  finalize: {
    index: 'Step 05',
    title: '装备与校对',
    description: '整理装备、导出存档，并检查整卡警告。',
  },
};

interface StepRailProps {
  activeStep: StepId;
  onSelect: (step: StepId) => void;
}

export const StepRail = ({ activeStep, onSelect }: StepRailProps) => (
  <div className={styles.stepList}>
    {STEP_IDS.map((step) => {
      const copy = STEP_COPY[step];
      const active = step === activeStep;
      return (
        <button
          key={step}
          className={`${styles.stepButton} ${active ? styles.stepButtonActive : ''}`}
          type="button"
          onClick={() => onSelect(step)}
        >
          <span className={styles.stepIndex}>{copy.index}</span>
          <span className={styles.stepName}>{copy.title}</span>
          <span className={styles.stepDescription}>{copy.description}</span>
        </button>
      );
    })}
  </div>
);
