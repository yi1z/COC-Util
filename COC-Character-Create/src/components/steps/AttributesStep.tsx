import styles from '../../styles/workspace.module.css';
import { useAgeRule, useInvestigator } from '../../state/investigator-context';
import { ATTRIBUTE_KEYS, PHYSICAL_PENALTY_KEYS } from '../../domain/types';

export const AttributesStep = () => {
  const { draft, adjustedAttributes, dispatch } = useInvestigator();
  const ageRule = useAgeRule(draft.profile.age);

  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>基础属性</h3>
            <div className={styles.sectionBody}>每项属性都保留投骰来源，同时允许单项重投或手动覆盖基础值。</div>
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.buttonGhost} type="button" onClick={() => dispatch({ type: 'refresh-age-adjustments' })}>
              重投年龄修正
            </button>
            <button className={styles.button} type="button" onClick={() => dispatch({ type: 'reroll-all' })}>
              一键重投全部
            </button>
          </div>
        </div>

        <div className={styles.attributeGrid}>
          {ATTRIBUTE_KEYS.map((key) => {
            const roll = draft.attributeRolls[key];
            const changed = adjustedAttributes[key] !== draft.rolledAttributes[key];
            return (
              <div key={key} className={styles.attributeCard}>
                <div className={styles.attributeHead}>
                  <span className={styles.attributeCode}>{key}</span>
                  <button className={styles.buttonGhost} type="button" onClick={() => dispatch({ type: 'reroll-attribute', key })}>
                    单项重投
                  </button>
                </div>
                <div className={styles.attributeResult}>
                  <strong className={styles.attributeNumber}>{adjustedAttributes[key]}</strong>
                  {changed ? <span className={styles.statusWarn}>含年龄修正</span> : null}
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>基础值</span>
                  <input
                    className={styles.numberInput}
                    type="number"
                    min={0}
                    max={99}
                    value={draft.rolledAttributes[key]}
                    onChange={(event) =>
                      dispatch({ type: 'set-rolled-attribute', key, value: Number(event.target.value) })
                    }
                  />
                </label>
                <div className={styles.attributeMeta}>
                  <div>{roll.label}</div>
                  <div>
                    {roll.formula}: [{roll.rolls.join(', ')}] =&gt; {roll.result}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>年龄规则</h3>
            <div className={styles.sectionBody}>
              当前年龄为 {draft.profile.age}，会触发 {ageRule.eduImprovementChecks} 次 EDU 成长检定，移动值修正 {ageRule.movPenalty}
              ，APP 修正 {ageRule.appPenalty}。
            </div>
          </div>
        </div>
        <div className={styles.pillRow}>
          <span className={styles.pill}>EDU 成长检定：{ageRule.eduImprovementChecks}</span>
          <span className={styles.pill}>APP 修正：-{ageRule.appPenalty}</span>
          <span className={styles.pill}>MOV 修正：-{ageRule.movPenalty}</span>
          <span className={styles.pill}>体能衰退池：{ageRule.physicalPenaltyPool}</span>
        </div>

        {ageRule.youthPenalty ? (
          <div className={styles.gridTwo}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>青春惩罚目标</span>
              <select
                className={styles.select}
                value={draft.ageChoices.youthPenaltyTarget}
                onChange={(event) =>
                  dispatch({
                    type: 'set-youth-target',
                    target: event.target.value as 'STR' | 'SIZ',
                  })
                }
              >
                <option value="STR">STR - 5</option>
                <option value="SIZ">SIZ - 5</option>
              </select>
            </label>
            <div className={styles.section}>
              <strong>青春幸运重投</strong>
              <div className={styles.sectionBody}>
                额外幸运投骰：{draft.ageChoices.youthLuckBonusRolls.length > 0 ? draft.ageChoices.youthLuckBonusRolls.join(' / ') : '尚未生成'}
              </div>
            </div>
          </div>
        ) : null}

        {ageRule.eduImprovementChecks > 0 ? (
          <div className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <h4 className={styles.sectionTitle}>EDU 成长检定结果</h4>
                <div className={styles.sectionBody}>检定成功时会增加 1D10 EDU，这里已经按当前基础值自动投好。</div>
              </div>
            </div>
            <div className={styles.previewList}>
              {draft.ageChoices.eduImprovementChecks.map((check, index) => (
                <div key={`${check.checkRoll}-${index}`} className={styles.previewRow}>
                  <span>
                    第 {index + 1} 次检定: d100 = {check.checkRoll}
                  </span>
                  <span>{check.success ? `成功 +${check.gain}` : '未通过'}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {ageRule.physicalPenaltyPool > 0 ? (
          <div className={styles.gridThree}>
            {PHYSICAL_PENALTY_KEYS.map((key) => (
              <label key={key} className={styles.field}>
                <span className={styles.fieldLabel}>{key} 体能衰退分配</span>
                <input
                  className={styles.numberInput}
                  type="number"
                  min={0}
                  max={ageRule.physicalPenaltyPool}
                  value={draft.ageChoices.physicalPenaltyAllocation[key]}
                  onChange={(event) =>
                    dispatch({
                      type: 'set-physical-penalty',
                      key,
                      value: Number(event.target.value),
                    })
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
};
