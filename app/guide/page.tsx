import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import { Icon } from "@/components/TaskShared";
import { GUIDE_PAGES } from "@/lib/guide-pages";

// 使い方ガイドのハブページ（server component）
export default function GuidePage() {
  return (
    <PublicShell current="guide" crumbs={[{ label: "使い方ガイド" }]}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>ツクリスト 使い方ガイド</h1>
        <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.8 }}>
          依頼・外注の納期を管理するための機能を、画面の操作に沿ってテーマごとに解説しています。
          はじめての方は「はじめかた」から読むのがおすすめです。
        </p>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {GUIDE_PAGES.map(p => (
          <Link key={p.slug} href={`/guide/${p.slug}`} className="card card-interactive row"
            style={{ padding: "16px 18px", textDecoration: "none", gap: 12 }}>
            <span className="grow">
              <span style={{ display: "block", fontWeight: 600, fontSize: 15 }}>{p.title}</span>
              <span className="text-meta" style={{ display: "block", marginTop: 4 }}>{p.summary}</span>
            </span>
            <span style={{ color: "var(--meta)", flexShrink: 0, display: "inline-flex" }}>
              <Icon name="chevronRight" size={16} />
            </span>
          </Link>
        ))}
      </div>
      <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, lineHeight: 1.7 }}>
        <Link href="/tools" style={{ color: "var(--accent)", fontWeight: 600 }}>納期の逆算・外注費の計算ができる無料ツールもあります</Link>
      </p>
    </PublicShell>
  );
}
