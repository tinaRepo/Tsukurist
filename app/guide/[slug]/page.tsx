import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import { Icon } from "@/components/TaskShared";
import { Section, Toc, InlineCta } from "@/components/GuideParts";
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

// 本文の要素ツリーから <Section title="..."> を集めて目次にする
function sectionTitles(node: ReactNode): string[] {
  const titles: string[] = [];
  Children.forEach(node, child => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{ title?: string; children?: ReactNode }>;
    if (el.type === Section) {
      if (el.props.title) titles.push(el.props.title);
      return;
    }
    titles.push(...sectionTitles(el.props.children));
  });
  return titles;
}

export default function GuideDetailPage({ params }: { params: { slug: string } }) {
  const index = GUIDE_PAGES.findIndex(p => p.slug === params.slug);
  if (index < 0) notFound();
  const page = GUIDE_PAGES[index];
  const prev = GUIDE_PAGES[index - 1];
  const next = GUIDE_PAGES[index + 1];
  const related = page.related.flatMap(r => {
    const target = getGuidePage(r.slug);
    return target ? [{ ...target, reason: r.reason }] : [];
  });

  // 本文の真ん中に「デモを試す」を挟む（セクションが4つ以上あるページのみ）
  const parts = Children.toArray((page.body as ReactElement<{ children?: ReactNode }>).props.children);
  const mid = parts.length >= 4 ? Math.ceil(parts.length / 2) : -1;

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

        <h1 style={{ fontSize: 24, lineHeight: 1.4, marginBottom: 20 }}>{page.title}</h1>
        <Toc titles={sectionTitles(page.body)} />
        <article>
          {parts.map((part, i) => (
            <Fragment key={i}>
              {part}
              {i + 1 === mid && <InlineCta />}
            </Fragment>
          ))}
        </article>

        {related.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 17, marginBottom: 12 }}>次に読むなら</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {related.map(r => (
                <Link key={r.slug} href={`/guide/${r.slug}`} className="card card-interactive"
                  style={{ padding: "12px 16px", textDecoration: "none", display: "block" }}>
                  <span style={{ display: "block", fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{r.reason}</span>
                  <span style={{ display: "block", fontWeight: 600, fontSize: 14, marginTop: 2 }}>{r.title}</span>
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

        <div className="row" style={{ justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 40 }}>
          <Link href="/demo" className="btn btn-secondary" style={{ textDecoration: "none" }}>デモを試す</Link>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>無料で始める</Link>
        </div>
      </main>
    </div>
  );
}
