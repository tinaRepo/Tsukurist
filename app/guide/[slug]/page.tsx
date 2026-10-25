import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import { Icon } from "@/components/TaskShared";
import { createPublicPageMetadata, SITE_URL } from "@/lib/seo";
import { GUIDE_PAGES, getGuidePage } from "@/lib/guide-pages";

export function generateStaticParams() {
  return GUIDE_PAGES.map(p => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getGuidePage(params.slug);
  if (!page) return {};
  return createPublicPageMetadata(page.title, page.description, `/guide/${page.slug}`);
}

export default function GuideDetailPage({ params }: { params: { slug: string } }) {
  const index = GUIDE_PAGES.findIndex(p => p.slug === params.slug);
  if (index < 0) notFound();
  const page = GUIDE_PAGES[index];
  const prev = GUIDE_PAGES[index - 1];
  const next = GUIDE_PAGES[index + 1];
  const related = page.related.map(getGuidePage).filter((p): p is NonNullable<typeof p> => !!p);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ツクリスト", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "使い方ガイド", item: `${SITE_URL}/guide` },
      { "@type": "ListItem", position: 3, name: page.title, item: `${SITE_URL}/guide/${page.slug}` },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <header className="doc-header">
        <BackButton />
        <span className="title">使い方ガイド</span>
      </header>
      <main className="container-narrow" style={{ padding: "32px 24px 80px" }}>
        <nav aria-label="パンくず" className="text-meta" style={{ marginBottom: 16 }}>
          <Link href="/" style={{ color: "var(--accent)" }}>ホーム</Link> ／{" "}
          <Link href="/guide" style={{ color: "var(--accent)" }}>使い方ガイド</Link>
        </nav>

        <h1 style={{ fontSize: 24, lineHeight: 1.4, marginBottom: 28 }}>{page.title}</h1>
        <article>{page.body}</article>

        {related.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 17, marginBottom: 12 }}>あわせて読みたい</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {related.map(r => (
                <Link key={r.slug} href={`/guide/${r.slug}`} className="card card-interactive"
                  style={{ padding: "12px 16px", textDecoration: "none", display: "block" }}>
                  <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{r.title}</span>
                  <span className="text-meta" style={{ display: "block", marginTop: 2 }}>{r.summary}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <nav aria-label="前後のガイド" className="row" style={{ justifyContent: "space-between", gap: 12, marginTop: 40 }}>
          {prev ? (
            <Link href={`/guide/${prev.slug}`} className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
              <Icon name="chevronLeft" size={14} /> {prev.summary}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/guide/${next.slug}`} className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
              {next.summary} <Icon name="chevronRight" size={14} />
            </Link>
          ) : <span />}
        </nav>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>無料で始める</Link>
        </div>
      </main>
    </div>
  );
}
