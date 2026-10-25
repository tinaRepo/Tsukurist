import type { ReactNode } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { Icon } from "@/components/TaskShared";
import { SITE_URL } from "@/lib/seo";
import { TOOLS, getTool } from "@/lib/tools";

// 無料ツールの各ページ共通の枠（パンくず・見出し・解説・他のツール・登録導線）。server component。
// children = ツール本体（client component）、explanation = ツールの使い方・考え方の解説文
export default function ToolPageShell({ slug, lead, children, explanation }: {
  slug: string; lead: string; children: ReactNode; explanation: ReactNode;
}) {
  const tool = getTool(slug)!;
  const others = TOOLS.filter(t => t.slug !== slug);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ツクリスト", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "無料ツール", item: `${SITE_URL}/tools` },
      { "@type": "ListItem", position: 3, name: tool.title, item: `${SITE_URL}/tools/${slug}` },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <header className="doc-header">
        <BackButton />
        <span className="title">無料ツール</span>
      </header>
      <main className="container-narrow" style={{ padding: "32px 24px 80px" }}>
        <nav aria-label="パンくず" className="text-meta" style={{ marginBottom: 16 }}>
          <Link href="/" style={{ color: "var(--accent)" }}>ホーム</Link> ／{" "}
          <Link href="/tools" style={{ color: "var(--accent)" }}>無料ツール</Link>
        </nav>
        <h1 style={{ fontSize: 24, lineHeight: 1.4, marginBottom: 12 }}>{tool.title}</h1>
        <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>{lead}</p>

        {children}

        <article style={{ marginTop: 48 }}>{explanation}</article>

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 17, marginBottom: 12 }}>ほかの無料ツール</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {others.map(t => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="card card-interactive row"
                style={{ padding: "12px 16px", textDecoration: "none", gap: 12 }}>
                <span className="grow">
                  <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                  <span className="text-meta" style={{ display: "block", marginTop: 2 }}>{t.summary}</span>
                </span>
                <span style={{ color: "var(--meta)", display: "inline-flex" }}><Icon name="chevronRight" size={16} /></span>
              </Link>
            ))}
          </div>
        </section>

        <div className="card" style={{ marginTop: 40, padding: "22px 20px", textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>依頼の納期を、まとめて管理しませんか？</div>
          <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
            ツクリストなら、依頼先・納期・金額・確認用画像を一覧で管理でき、納期が近づくとお知らせします。無料プランは期限なく使えます。
          </p>
          <div className="row" style={{ justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/demo" className="btn btn-secondary" style={{ textDecoration: "none" }}>デモを試す</Link>
            <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>無料で始める</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
