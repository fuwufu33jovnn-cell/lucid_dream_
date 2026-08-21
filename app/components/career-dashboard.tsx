import Link from "next/link";
import styles from "./career-studio.module.css";

const FLOW = [
  ["01", "Project evidence", "记录问题、角色、限制、决策、迭代和结果，并为每个说法补充依据。"],
  ["02", "Application artifacts", "基于已确认的证据生成简历要点、求职信段落和作品集结构。"],
  ["03", "English practice", "进行 60 秒介绍、5 分钟 walkthrough 和职位面试练习，获得语言反馈。"],
];

export function CareerDashboard() {
  return <section className={styles.dashboard}>
    <div className={styles.heroCard}><div><span className={styles.kicker}>YOUR NEXT ACTION</span><h2>先建立一份可信的项目证据</h2><p>Career Studio 不再只是草稿本。它会检查证据缺口，再引导你生成材料和练习表达。</p></div><Link className={styles.primaryAction} href="/career/project/">Create project</Link></div>
    <div className={styles.flowGrid}>{FLOW.map(([number,title,copy]) => <article className={styles.flowCard} key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
    <div className={styles.projectGrid}>
      <article className={styles.projectCard}><div className={styles.projectTop}><span>PROJECT TEMPLATE</span><b>0 / 7</b></div><h3>New evidence-based case study</h3><p>目标职位、项目背景与证据还未填写。</p><div className={styles.progress}><span /></div><Link href="/career/project/">Open workspace →</Link></article>
      <article className={styles.insightCard}><span className={styles.kicker}>WHY IT HELPS</span><h3>每段生成内容都能追溯到证据</h3><p>缺少数据时，系统会向你提问，不会替你编造影响、职责或研究结果。</p></article>
    </div>
  </section>;
}
