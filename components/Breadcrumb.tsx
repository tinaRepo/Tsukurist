import Link from "next/link";
import { SITE_URL } from "@/lib/site";

// 公開ページ共通のパンくずリスト（/guide・/tools・/terms・/privacy・/tokusho）。
// 先頭の「ホーム」は自動で付く。最後（現在のページ）は href を付けない。
// ※ "/" は未ログインならサービス紹介、ログイン中ならアプリを表示する。
//   → ログイン中の人にとっての「アプリを開く」の役割もこのリンクが担う。
// 構造化データ（BreadcrumbList）もここで出力する。
export type Crumb = { label: string; href?: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "ホーム", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href === "/" ? "" : c.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="パンくず" className="text-meta" style={{ marginBottom: 16 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: "4px 8px", alignItems: "center" }}>
        {all.map((c, i) => (
          <li key={i} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            {c.href ? (
              <Link href={c.href} style={{ color: "var(--accent)" }}>{c.label}</Link>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
            {i < all.length - 1 && <span aria-hidden="true">／</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
