import { useDeferredValue, useState } from 'react';
import { OCCUPATION_ATTRIBUTE_KEYS } from '../../domain/types';
import { OCCUPATION_FORMULA_PRESETS } from '../../domain/skills';
import styles from '../../styles/workspace.module.css';
import { useInvestigator } from '../../state/investigator-context';

export const SkillsStep = () => {
  const {
    draft,
    skillCatalog,
    skillTotals,
    occupationPoints,
    interestPoints,
    spentOccupation,
    spentInterest,
    dispatch,
  } = useInvestigator();
  const [query, setQuery] = useState('');
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillBase, setCustomSkillBase] = useState(5);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredSkills = skillCatalog.filter((skill) => {
    if (!deferredQuery) {
      return true;
    }

    return skill.name.toLowerCase().includes(deferredQuery) || skill.category.toLowerCase().includes(deferredQuery);
  });

  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>职业配置</h3>
            <div className={styles.sectionBody}>职业点公式、信用评级区间和职业技能都可以自由调整，适合房规或自定义职业。</div>
          </div>
          <div className={styles.pillRow}>
            <span className={styles.pill}>职业点 {spentOccupation} / {occupationPoints}</span>
            <span className={styles.pill}>兴趣点 {spentInterest} / {interestPoints}</span>
          </div>
        </div>

        <div className={styles.gridThree}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>职业名称</span>
            <input
              className={styles.input}
              value={draft.occupation.name}
              onChange={(event) => dispatch({ type: 'set-occupation-name', value: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>信用评级最小值</span>
            <input
              className={styles.numberInput}
              type="number"
              min={0}
              max={99}
              value={draft.occupation.creditRating.min}
              onChange={(event) => dispatch({ type: 'set-credit-range', bound: 'min', value: Number(event.target.value) })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>信用评级最大值</span>
            <input
              className={styles.numberInput}
              type="number"
              min={0}
              max={99}
              value={draft.occupation.creditRating.max}
              onChange={(event) => dispatch({ type: 'set-credit-range', bound: 'max', value: Number(event.target.value) })}
            />
          </label>
        </div>

        <div className={styles.buttonRow}>
          {OCCUPATION_FORMULA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.buttonGhost}
              onClick={() => dispatch({ type: 'set-formula-preset', presetId: preset.id })}
            >
              {preset.label}
            </button>
          ))}
          <button className={styles.buttonGhost} type="button" onClick={() => dispatch({ type: 'add-formula-term' })}>
            新增公式项
          </button>
        </div>

        <div className={styles.gridThree}>
          {draft.occupation.formula.map((term, index) => (
            <div key={`${term.attribute}-${index}`} className={styles.section}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>属性</span>
                <select
                  className={styles.select}
                  value={term.attribute}
                  onChange={(event) =>
                    dispatch({
                      type: 'set-formula-term',
                      index,
                      field: 'attribute',
                      value: event.target.value,
                    })
                  }
                >
                  {OCCUPATION_ATTRIBUTE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>倍率</span>
                <input
                  className={styles.numberInput}
                  type="number"
                  min={1}
                  max={6}
                  value={term.multiplier}
                  onChange={(event) =>
                    dispatch({
                      type: 'set-formula-term',
                      index,
                      field: 'multiplier',
                      value: Number(event.target.value),
                    })
                  }
                />
              </label>
              {draft.occupation.formula.length > 1 ? (
                <button
                  className={styles.buttonDanger}
                  type="button"
                  onClick={() => dispatch({ type: 'remove-formula-term', index })}
                >
                  删除公式项
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>职业技能选择</h3>
            <div className={styles.sectionBody}>勾选后才能把职业点投入到该技能。兴趣点和额外点数则始终可自由分配。</div>
          </div>
          <button className={styles.buttonGhost} type="button" onClick={() => dispatch({ type: 'reset-skill-allocations' })}>
            恢复技能基础值
          </button>
        </div>
        <div className={styles.pillRow}>
          {draft.occupation.occupationalSkillIds.map((id) => {
            const skill = skillCatalog.find((entry) => entry.id === id);
            return skill ? <span key={id} className={styles.pill}>{skill.name}</span> : null;
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>技能分配</h3>
            <div className={styles.sectionBody}>支持搜索和自定义技能，右侧总值会实时反映基础值与点数投入。</div>
          </div>
          <label className={styles.field} style={{ minWidth: 220 }}>
            <span className={styles.fieldLabel}>快速筛选</span>
            <input
              className={styles.input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="输入技能名或分类"
            />
          </label>
        </div>

        <div className={styles.skillTable}>
          <div className={styles.skillHeader}>
            <span>技能</span>
            <span>基础</span>
            <span>职业</span>
            <span>兴趣</span>
            <span>额外</span>
            <span>总值</span>
          </div>
          {filteredSkills.map((skill) => {
            const allocation = draft.skillAllocations[skill.id] ?? { skillId: skill.id, occupation: 0, interest: 0, extra: 0 };
            const total = skillTotals[skill.id];
            const selected = draft.occupation.occupationalSkillIds.includes(skill.id);
            return (
              <div key={skill.id} className={styles.skillRow}>
                <div className={styles.skillName}>
                  <div className={styles.skillNameTop}>
                    <input
                      className={styles.checkbox}
                      type="checkbox"
                      checked={selected}
                      onChange={() => dispatch({ type: 'toggle-occupational-skill', skillId: skill.id })}
                    />
                    <strong>{skill.name}</strong>
                  </div>
                  <span className={styles.mutedText}>{skill.category}</span>
                </div>
                <span>{total.base}</span>
                <input
                  className={styles.numberInput}
                  type="number"
                  min={0}
                  max={99}
                  value={allocation.occupation}
                  onChange={(event) =>
                    dispatch({
                      type: 'update-skill-allocation',
                      skillId: skill.id,
                      field: 'occupation',
                      value: Number(event.target.value),
                    })
                  }
                />
                <input
                  className={styles.numberInput}
                  type="number"
                  min={0}
                  max={99}
                  value={allocation.interest}
                  onChange={(event) =>
                    dispatch({
                      type: 'update-skill-allocation',
                      skillId: skill.id,
                      field: 'interest',
                      value: Number(event.target.value),
                    })
                  }
                />
                <input
                  className={styles.numberInput}
                  type="number"
                  min={0}
                  max={99}
                  value={allocation.extra}
                  onChange={(event) =>
                    dispatch({
                      type: 'update-skill-allocation',
                      skillId: skill.id,
                      field: 'extra',
                      value: Number(event.target.value),
                    })
                  }
                />
                <strong>{total.total}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>新增自定义技能</h3>
            <div className={styles.sectionBody}>如果你的房规里需要额外技能，可以直接加进目录。</div>
          </div>
        </div>
        <div className={styles.gridThree}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>技能名称</span>
            <input className={styles.input} value={customSkillName} onChange={(event) => setCustomSkillName(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>基础值</span>
            <input
              className={styles.numberInput}
              type="number"
              min={0}
              max={99}
              value={customSkillBase}
              onChange={(event) => setCustomSkillBase(Number(event.target.value))}
            />
          </label>
          <div className={styles.buttonRow} style={{ alignItems: 'end' }}>
            <button
              className={styles.button}
              type="button"
              onClick={() => {
                dispatch({ type: 'add-custom-skill', name: customSkillName, base: customSkillBase });
                setCustomSkillName('');
                setCustomSkillBase(5);
              }}
            >
              加入目录
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
