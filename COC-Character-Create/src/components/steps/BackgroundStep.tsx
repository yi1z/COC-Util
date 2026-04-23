import styles from '../../styles/workspace.module.css';
import { useInvestigator } from '../../state/investigator-context';

const FIELDS: Array<{ key: keyof ReturnType<typeof useInvestigator>['draft']['backstory']; label: string; placeholder: string }> = [
  { key: 'personalDescription', label: '外观与气质', placeholder: '角色给人的第一印象是什么？' },
  { key: 'ideologyBeliefs', label: '思想 / 信念', placeholder: '支撑他继续调查的信条是什么？' },
  { key: 'significantPeople', label: '重要之人', placeholder: '谁对他最重要？' },
  { key: 'meaningfulLocations', label: '意义非凡之地', placeholder: '哪一个地点承载了关键记忆？' },
  { key: 'treasuredPossessions', label: '宝贵之物', placeholder: '什么物件值得他冒险保留？' },
  { key: 'traits', label: '显著特质', placeholder: '让人一眼记住的习惯、腔调或举止。' },
  { key: 'injuriesScars', label: '伤痕与旧患', placeholder: '过去留下些什么痕迹？' },
  { key: 'phobiasManias', label: '恐惧 / 执念', placeholder: '在理智之外最容易失控的是什么？' },
  { key: 'arcaneTomesSpells', label: '秘典 / 咒术', placeholder: '是否已经接触过不可名状之物？' },
  { key: 'encounters', label: '怪异遭遇', placeholder: '第一次与未知接触的经历。' },
  { key: 'notes', label: '补充备注', placeholder: '任何你想记下的守秘人钩子或 RP 方向。' },
];

export const BackgroundStep = () => {
  const { draft, dispatch } = useInvestigator();

  return (
    <div className={styles.stack}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h3 className={styles.sectionTitle}>背景画像</h3>
            <div className={styles.sectionBody}>这些字段会直接在最终角色卡里留下调查员的故事骨架。</div>
          </div>
        </div>
        <div className={styles.gridTwo}>
          {FIELDS.map((field) => (
            <label key={field.key} className={styles.field}>
              <span className={styles.fieldLabel}>{field.label}</span>
              <textarea
                className={styles.textarea}
                value={draft.backstory[field.key]}
                placeholder={field.placeholder}
                onChange={(event) =>
                  dispatch({
                    type: 'update-backstory',
                    field: field.key,
                    value: event.target.value,
                  })
                }
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
};
