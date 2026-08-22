import { AppShell } from "../../components/app-shell";
import { VocabularyNotebook } from "../../components/vocabulary-notebook";

export default function VocabularyPage() {
  return <AppShell active="language"><header className="page-heading compact-heading library-heading"><div><p className="eyebrow">LANGUAGE LAB · SAVED WORDS</p><h1>My Vocabulary</h1><p className="lede">在素材、Today、雅思和 Career 中收藏的词汇集中在这里，保留语境并安排复习。</p></div><span className="phase-pill">WORD NOTEBOOK</span></header><VocabularyNotebook /></AppShell>;
}
