import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import { createPublicPageMetadata } from "@/lib/seo";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = createPublicPageMetadata(
  "ツクリストとは・運営者情報",
  "ツクリストは、外注・依頼のタスクや納期を管理するWebアプリです。サービスの内容、運営責任者、公式情報をご案内します。",
  "/about"
);

const operatorJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/about#operator`,
  name: "中沢拓真",
  url: `${SITE_URL}/about`,
  description: "ツクリストの運営責任者。",
};

export default function AboutPage() {
  return (
    <PublicShell crumbs={[{ label: "ツクリストについて" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(operatorJsonLd) }} />
      <h1 style={{ fontSize: 24, lineHeight: 1.4, marginBottom: 16 }}>ツクリストについて</h1>

      <section className="doc-section">
        <h2>ツクリストとは</h2>
        <div>
          <p>
            ツクリストは、外注や依頼のタスク、進捗、納期、金額、確認用画像をまとめて管理するWebアプリです。
            依頼の状況を一覧で把握し、納期の見落としを防ぐことを目的としています。
          </p>
          <p>
            スマートフォン・タブレット・PCから利用でき、無料プランのほか、用途に応じた有料プランを提供しています。
          </p>
        </div>
      </section>

      <section className="doc-section">
        <h2>提供している機能</h2>
        <div>
          <ul>
            <li>依頼内容、依頼先、進捗状況、納期、金額の管理</li>
            <li>タスクごとの確認用・作業中・完成画像の管理</li>
            <li>納期が近づいたときのアラートと通知設定</li>
            <li>有料プランでのカレンダー表示や共有用公開ページ</li>
          </ul>
          <p>
            <Link href="/guide" style={{ color: "var(--accent)" }}>使い方ガイド</Link>
            {" "}と<Link href="/tools" style={{ color: "var(--accent)" }}>無料ツール</Link>もご利用いただけます。
          </p>
        </div>
      </section>

      <section className="doc-section">
        <h2>運営者</h2>
        <div>
          <dl style={{ display: "grid", gridTemplateColumns: "minmax(110px, auto) 1fr", gap: "8px 16px" }}>
            <dt className="text-muted">サービス名</dt>
            <dd>ツクリスト</dd>
            <dt className="text-muted">公式サイト</dt>
            <dd><a href={SITE_URL} style={{ color: "var(--accent)" }}>{SITE_URL}</a></dd>
            <dt className="text-muted">運営責任者</dt>
            <dd>中沢拓真</dd>
            <dt className="text-muted">お問い合わせ</dt>
            <dd><a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--accent)" }}>{SUPPORT_EMAIL}</a></dd>
          </dl>
          <p style={{ marginTop: 16 }}>
            販売業者・所在地などの表示については
            {" "}<Link href="/tokusho" style={{ color: "var(--accent)" }}>特定商取引法に基づく表記</Link>をご確認ください。
          </p>
        </div>
      </section>

      <section className="doc-section">
        <h2>関連情報</h2>
        <div>
          <ul>
            <li><Link href="/terms" style={{ color: "var(--accent)" }}>利用規約</Link></li>
            <li><Link href="/privacy" style={{ color: "var(--accent)" }}>プライバシーポリシー</Link></li>
            <li><Link href="/tokusho" style={{ color: "var(--accent)" }}>特定商取引法に基づく表記</Link></li>
          </ul>
        </div>
      </section>
    </PublicShell>
  );
}
