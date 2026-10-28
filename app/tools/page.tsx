import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { GuestOnly } from "@/components/GuideAuth";
import { Icon } from "@/components/TaskShared";
import { createPublicPageMetadata } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";

export const metadata = createPublicPageMetadata(
  "無料ツール",
  "納期の逆算、外注費の見積もり計算、依頼書の作成など、外注・依頼の管理に役立つ無料ツール集です。登録不要で使えます。",
  "/tools"
);

export default function ToolsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <main className="container-narrow" style={{ padding: "32px 24px 80px" }}>
        <Breadcrumb items={[{ label: "無料ツール" }]} />
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>外注・依頼に役立つ無料ツール</h1>
          <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.8 }}>
            登録なしでそのまま使えます。入力した内容は、お使いのブラウザの中だけで処理されます。
          </p>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {TOOLS.map(t => (
            <Link key={t.slug} href={`/tools/${t.slug}`} className="card card-interactive row"
              style={{ padding: "16px 18px", textDecoration: "none", gap: 12 }}>
              <span className="grow">
                <span style={{ display: "block", fontWeight: 600, fontSize: 15 }}>{t.title}</span>
                <span className="text-meta" style={{ display: "block", marginTop: 4 }}>{t.summary}</span>
              </span>
              <span style={{ color: "var(--meta)", flexShrink: 0, display: "inline-flex" }}><Icon name="chevronRight" size={16} /></span>
            </Link>
          ))}
        </div>
        <GuestOnly>
          <div className="card" style={{ marginTop: 32, padding: "20px", textAlign: "center" }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>依頼の進み具合は、ツクリストで一覧管理</div>
            <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>納期・金額・確認用画像をまとめて管理し、納期が近づくとお知らせします。</p>
            <div className="row" style={{ justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <Link href="/guide" className="btn btn-secondary" style={{ textDecoration: "none" }}>使い方ガイド</Link>
              <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>無料で始める</Link>
            </div>
          </div>
        </GuestOnly>
      </main>
    </div>
  );
}
