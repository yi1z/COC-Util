import styles from '../../styles/workspace.module.css';
import { useInvestigator } from '../../state/investigator-context';

const CATEGORIES = [
  { key: 'weapon', label: '武器' },
  { key: 'gear', label: '装备' },
  { key: 'book', label: '文献' },
  { key: 'cash', label: '现金' },
  { key: 'custom', label: '其他' },
] as const;

export const FinalizeStep = () => {
  const { draft, issues, dispatch } = useInvestigator();

  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>装备记录</h3>
            <div className={styles.sectionBody}>按类别快速加入条目，适合记录武器、随身器具、文献和现金状况。</div>
          </div>
          <div className={styles.buttonRow}>
            {CATEGORIES.map((category) => (
              <button
                key={category.key}
                className={styles.buttonGhost}
                type="button"
                onClick={() => dispatch({ type: 'add-equipment', category: category.key })}
              >
                添加{category.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.equipmentTable}>
          {draft.equipment.length === 0 ? (
            <div className={styles.hintPanel}>目前没有装备条目。你可以在这里整理角色卡最后的物资面板。</div>
          ) : (
            draft.equipment.map((item) => (
              <div key={item.id} className={styles.equipmentRow}>
                <select
                  className={styles.select}
                  value={item.category}
                  onChange={(event) =>
                    dispatch({
                      type: 'update-equipment',
                      id: item.id,
                      field: 'category',
                      value: event.target.value,
                    })
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  value={item.name}
                  placeholder="名称"
                  onChange={(event) =>
                    dispatch({
                      type: 'update-equipment',
                      id: item.id,
                      field: 'name',
                      value: event.target.value,
                    })
                  }
                />
                <input
                  className={styles.input}
                  value={item.detail}
                  placeholder="备注，如伤害、弹药、来源"
                  onChange={(event) =>
                    dispatch({
                      type: 'update-equipment',
                      id: item.id,
                      field: 'detail',
                      value: event.target.value,
                    })
                  }
                />
                <input
                  className={styles.numberInput}
                  type="number"
                  min={0}
                  max={99}
                  value={item.quantity}
                  onChange={(event) =>
                    dispatch({
                      type: 'update-equipment',
                      id: item.id,
                      field: 'quantity',
                      value: Number(event.target.value),
                    })
                  }
                />
                <button className={styles.buttonDanger} type="button" onClick={() => dispatch({ type: 'remove-equipment', id: item.id })}>
                  删
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>最终校对</h3>
            <div className={styles.sectionBody}>这里会集中显示当前草稿的关键警告，方便你在导出前扫一遍。</div>
          </div>
        </div>
        <div className={styles.issues}>
          {issues.length === 0 ? (
            <div className={styles.statusGood}>当前草稿没有规则层面的阻塞问题。</div>
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
    </div>
  );
};
