import styles from '../../styles/workspace.module.css';
import { useInvestigator } from '../../state/investigator-context';

export const IdentityStep = () => {
  const { draft, deferredSnapshots, dispatch, saveSnapshot, loadSnapshot, deleteSnapshot } = useInvestigator();

  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>调查员档案</h3>
            <div className={styles.sectionBody}>先定义基础身份。这里的年龄会即时影响后面的年龄规则和派生值。</div>
          </div>
        </div>
        <div className={styles.gridTwo}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>调查员姓名</span>
            <input
              className={styles.input}
              value={draft.profile.investigatorName}
              onChange={(event) => dispatch({ type: 'update-profile', field: 'investigatorName', value: event.target.value })}
              placeholder="例如：林秋生"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>玩家名</span>
            <input
              className={styles.input}
              value={draft.profile.playerName}
              onChange={(event) => dispatch({ type: 'update-profile', field: 'playerName', value: event.target.value })}
              placeholder="谁在扮演这个角色"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>年龄</span>
            <input
              className={styles.numberInput}
              type="number"
              min={15}
              max={90}
              value={draft.profile.age}
              onChange={(event) => dispatch({ type: 'update-profile', field: 'age', value: Number(event.target.value) })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>职业名称</span>
            <input
              className={styles.input}
              value={draft.profile.occupation}
              onChange={(event) => dispatch({ type: 'set-occupation-name', value: event.target.value })}
              placeholder="例如：调查记者"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>代词 / 称呼</span>
            <input
              className={styles.input}
              value={draft.profile.pronouns}
              onChange={(event) => dispatch({ type: 'update-profile', field: 'pronouns', value: event.target.value })}
              placeholder="例如：她 / he / 其"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>性别</span>
            <input
              className={styles.input}
              value={draft.profile.sex}
              onChange={(event) => dispatch({ type: 'update-profile', field: 'sex', value: event.target.value })}
              placeholder="可留空"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>居住地</span>
            <input
              className={styles.input}
              value={draft.profile.residence}
              onChange={(event) => dispatch({ type: 'update-profile', field: 'residence', value: event.target.value })}
              placeholder="例如：上海法租界"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>出生地</span>
            <input
              className={styles.input}
              value={draft.profile.birthplace}
              onChange={(event) => dispatch({ type: 'update-profile', field: 'birthplace', value: event.target.value })}
              placeholder="例如：宁波"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>时代背景</span>
            <select
              className={styles.select}
              value={draft.profile.era}
              onChange={(event) => dispatch({ type: 'update-profile', field: 'era', value: event.target.value })}
            >
              <option value="1920s">1920年代</option>
              <option value="modern">现代</option>
              <option value="custom">自定义时代</option>
            </select>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>本地角色快照</h3>
            <div className={styles.sectionBody}>快照会留在浏览器里，适合保存多个备选角色。当前草稿仍会自动保存。</div>
          </div>
          <button className={styles.buttonGhost} type="button" onClick={() => saveSnapshot()}>
            保存当前快照
          </button>
        </div>
        <div className={styles.snapshotList}>
          {deferredSnapshots.length === 0 ? (
            <div className={styles.hintPanel}>暂时还没有快照。完成一个草稿后可以随时存一份，后面再回来挑。</div>
          ) : (
            deferredSnapshots.map((snapshot) => (
              <div key={snapshot.id} className={styles.snapshotRow}>
                <div className={styles.snapshotInfo}>
                  <strong>{snapshot.name}</strong>
                  <span className={styles.mutedText}>{new Date(snapshot.savedAt).toLocaleString('zh-CN')}</span>
                </div>
                <div className={styles.buttonRow}>
                  <button className={styles.buttonGhost} type="button" onClick={() => loadSnapshot(snapshot.id)}>
                    载入
                  </button>
                  <button className={styles.buttonDanger} type="button" onClick={() => deleteSnapshot(snapshot.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
