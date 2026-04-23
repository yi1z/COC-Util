import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { PreviewPanel } from './components/PreviewPanel';
import { StepRail } from './components/StepRail';
import { AttributesStep } from './components/steps/AttributesStep';
import { BackgroundStep } from './components/steps/BackgroundStep';
import { FinalizeStep } from './components/steps/FinalizeStep';
import { IdentityStep } from './components/steps/IdentityStep';
import { SkillsStep } from './components/steps/SkillsStep';
import { InvestigatorProvider, useInvestigator } from './state/investigator-context';
import styles from './styles/workspace.module.css';

const STEP_CONTENT = {
  identity: {
    title: '基础设定',
    lead: '用几分钟先定下角色的年代、身份和年龄，这会决定后续属性修正与角色口味。',
    render: () => <IdentityStep />,
  },
  attributes: {
    title: '属性生成',
    lead: '投骰只是起点。你可以单项重投、手动校正，并把年龄规则变成可见的建卡信息。',
    render: () => <AttributesStep />,
  },
  background: {
    title: '身份与背景',
    lead: '把调查员从一组数值变成能走进剧本的人，这一步会留下行为动机和叙事钩子。',
    render: () => <BackgroundStep />,
  },
  skills: {
    title: '职业与技能点',
    lead: '这里更像一张调查工作台：职业点公式、职业技能和房规技能都能自由组合。',
    render: () => <SkillsStep />,
  },
  finalize: {
    title: '装备与校对',
    lead: '整理最后的装备和摘要，然后把整卡状态检查一遍，方便保存和导出。',
    render: () => <FinalizeStep />,
  },
} as const;

const Workspace = () => {
  const { draft, issues, setStep, goStep, stepIndex, saveSnapshot, exportJson, importJson, clearDraft } = useInvestigator();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const stepContent = STEP_CONTENT[draft.currentStep];
  const issueSummary = useMemo(() => {
    const errors = issues.filter((issue) => issue.level === 'error').length;
    if (errors > 0) {
      return `${errors} 个错误待处理`;
    }
    if (issues.length > 0) {
      return `${issues.length} 条提醒待确认`;
    }
    return '规则校对正常';
  }, [issues]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleExport = () => {
    const json = exportJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${draft.profile.investigatorName || 'coc-investigator'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast('JSON 存档已导出。');
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      importJson(raw);
      setToast('角色存档已导入。');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '导入失败，请检查 JSON 格式。');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <div className={styles.shell}>
          <aside className={styles.rail}>
            <div className={styles.brand}>
              <span className={styles.eyebrow}>Call of Cthulhu 7th</span>
              <h1 className={styles.brandTitle}>档案式车卡工具</h1>
              <p className={styles.brandBody}>
                把随机性、规则修正和人物背景装进同一张工作台里，边写边看右侧角色卡成形。
              </p>
            </div>

            <StepRail activeStep={draft.currentStep} onSelect={setStep} />

            <div className={styles.railFooter}>
              <div className={styles.hintPanel}>
                当前状态：<strong>{issueSummary}</strong>
              </div>
              <div className={styles.hintPanel}>
                草稿会自动保存到浏览器本地。你也可以手动保存快照，保留多个调查员分支。
              </div>
            </div>
          </aside>

          <main className={styles.main}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <button className={styles.button} type="button" onClick={() => setToast(`已保存快照：${saveSnapshot()}`)}>
                  保存快照
                </button>
                <button className={styles.buttonGhost} type="button" onClick={handleExport}>
                  导出 JSON
                </button>
                <button className={styles.buttonGhost} type="button" onClick={() => fileInputRef.current?.click()}>
                  导入 JSON
                </button>
                <button className={styles.buttonDanger} type="button" onClick={() => { clearDraft(); setToast('当前草稿已清空。'); }}>
                  清空当前草稿
                </button>
                <button className={`${styles.buttonGhost} ${styles.previewToggle}`} type="button" onClick={() => setPreviewOpen(true)}>
                  打开预览
                </button>
                <input ref={fileInputRef} hidden type="file" accept="application/json" onChange={handleImport} />
              </div>
              <div className={styles.toolbarMeta}>
                上次修改：{new Date(draft.updatedAt).toLocaleString('zh-CN')} | 自动保存已开启
              </div>
            </div>

            <div className={styles.workspace}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>{stepContent.title}</h2>
                <p className={styles.stepLead}>{stepContent.lead}</p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={draft.currentStep}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  {stepContent.render()}
                </motion.div>
              </AnimatePresence>

              <div className={styles.timelineNav}>
                <button className={styles.buttonGhost} type="button" onClick={() => goStep(-1)} disabled={stepIndex === 0}>
                  上一步
                </button>
                <button className={styles.button} type="button" onClick={() => goStep(1)} disabled={stepIndex === 4}>
                  下一步
                </button>
              </div>
            </div>
          </main>

          <PreviewPanel />
        </div>
      </div>

      <AnimatePresence>
        {previewOpen ? (
          <>
            <motion.div
              className={styles.drawerBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewOpen(false)}
            />
            <motion.div
              className={styles.drawer}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <PreviewPanel />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export const App = () => (
  <InvestigatorProvider>
    <Workspace />
  </InvestigatorProvider>
);
