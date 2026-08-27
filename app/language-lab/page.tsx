import { AppShell } from "../components/app-shell";
import { EditorialLab } from "../components/editorial-lab";

export default function LanguageLabPage() {
  return (
    <AppShell active="language">
      <header className="editorial-page-heading lab-page-heading">
        <p className="editorial-folio">02 / LANGUAGE LAB / ISSUE 08</p>
        <h1>FOLLOW THE<br />INTEREST FIRST.</h1>
        <div><p>电影、音乐、设计、文化和一些随机掉落。内容先让你想点进去，英语练习藏在第二层。</p><span>24 EDITED ENTRIES</span></div>
      </header>
      <EditorialLab />
    </AppShell>
  );
}
