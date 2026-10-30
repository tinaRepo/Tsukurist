import Link from "next/link";
import { SITE_URL } from "@/lib/site";

// ヘッダー直下に置く、パンくずの帯。先頭の「ホーム」は自動で付く。
// 最後（現在のページ）は href を付けない。BreadcrumbList の構造化データもここで出力する。
// 見た目は app/public-pages.css（.breadcrumb-*）。スマホでは折り返さず、現在のページ名だけ … で省略する。
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
    <nav aria-label="パンくず" className="breadcrumb-bar">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="breadcrumb-inner">
        <ol className="breadcrumb-list">
          {all.map((c, i) => (
            <li key={i}>
              {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              {i < all.length - 1 && <span aria-hidden="true">／</span>}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
