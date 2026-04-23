import { useMemo } from 'react';
import styles from '../styles/workspace.module.css';
import { useInvestigator } from '../state/investigator-context';

const skillTopCount = 10;

export const PreviewPanel = () => {
  const { draft, adjustedAttributes, derivedStats, skillCatalog, skillTotals, issues } = useInvestigator();

  const topSkills = useMemo(
    () =>
      [...skillCatalog]
        .map((skill) => ({
          id: skill.id,
          name: skill.name,
          total: skillTotals[skill.id]?.total ?? 0,
        }))
        .sort((left, right) => right.total - left.total)
        .slice(0, skillTopCount),
    [skillCatalog, skillTotals],
  );

  return (
    <aside className={styles.preview} aria-label="角色卡实时预览">
      <header className={styles.paperHeader}>
        <span className={styles.eyebrow}>Investigator Dossier</span>
        <h2 className={styles.paperTitle}>{draft.profile.investigatorName || '未命名调查员'}</h2>
        <div className={styles.paperMeta}>
          <span>{draft.profile.occupation || '待定职业'}</span>
          <span>{draft.profile.age} 岁</span>
          <span>{draft.profile.era}</span>
          <span>{draft.profile.residence || '居所待定'}</span>
        </div>
      </header>

      <section className={styles.paperSection}>
        <h3 className={styles.paperSectionTitle}>核心属性</h3>
        <div className={styles.paperGrid}>
          {Object.entries(adjustedAttributes).map(([key, value]) => (
            <div key={key} className={styles.paperStat}>
              <span className={styles.paperStatLabel}>{key}</span>
              <strong className={styles.paperStatValue}>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.paperSection}>
        <h3 className={styles.paperSectionTitle}>派生值</h3>
        <div className={styles.paperGrid}>
          <div className={styles.paperStat}>
            <span className={styles.paperStatLabel}>HP</span>
            <strong className={styles.paperStatValue}>{derivedStats.hp}</strong>
          </div>
          <div className={styles.paperStat}>
            <span className={styles.paperStatLabel}>MP</span>
            <strong className={styles.paperStatValue}>{derivedStats.mp}</strong>
          </div>
          <div className={styles.paperStat}>
            <span className={styles.paperStatLabel}>SAN</span>
            <strong className={styles.paperStatValue}>{derivedStats.san}</strong>
          </div>
          <div className={styles.paperStat}>
            <span className={styles.paperStatLabel}>MOV</span>
            <strong className={styles.paperStatValue}>{derivedStats.mov}</strong>
          </div>
          <div className={styles.paperStat}>
            <span className={styles.paperStatLabel}>DB</span>
            <strong className={styles.paperStatValue}>{derivedStats.damageBonus}</strong>
          </div>
          <div className={styles.paperStat}>
            <span className={styles.paperStatLabel}>Build</span>
            <strong className={styles.paperStatValue}>{derivedStats.build}</strong>
          </div>
        </div>
      </section>

      <section className={styles.paperSection}>
        <h3 className={styles.paperSectionTitle}>高值技能</h3>
        <div className={styles.previewList}>
          {topSkills.map((skill) => (
            <div key={skill.id} className={styles.previewRow}>
              <span>{skill.name}</span>
              <strong>{skill.total}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.paperSection}>
        <h3 className={styles.paperSectionTitle}>装备与摘要</h3>
        <div className={styles.previewList}>
          {draft.equipment.length === 0 ? (
            <div className={`${styles.previewRow} ${styles.previewRowMuted}`}>
              <span>暂无装备记录</span>
            </div>
          ) : (
            draft.equipment.slice(0, 6).map((item) => (
              <div key={item.id} className={styles.previewRow}>
                <span>{item.name || '未命名装备'}</span>
                <span>x{item.quantity}</span>
              </div>
            ))
          )}
          <div className={`${styles.previewRow} ${styles.previewRowMuted}`}>
            <span>关键信念</span>
            <span>{draft.backstory.ideologyBeliefs || '待填写'}</span>
          </div>
        </div>
      </section>

      <section className={styles.paperSection}>
        <h3 className={styles.paperSectionTitle}>校对警告</h3>
        <div className={styles.issues}>
          {issues.length === 0 ? (
            <div className={styles.statusGood}>整卡状态良好，可继续保存或导出。</div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className={`${styles.issueItem} ${issue.level === 'error' ? styles.issueError : styles.issueWarn}`}
              >
                {issue.message}
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
};
