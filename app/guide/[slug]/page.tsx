import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import { PageCta } from "@/components/GuideAuth";
import { Icon } from "@/components/TaskShared";
import { Section, Toc, InlineCta } from "@/components/GuideParts";
import { createPublicPageMetadata } from "@/lib/seo";
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

  return (
    <PublicShell current="guide" crumbs={[{ label: "使い方ガイド", href: "/guide" }, { label: page.summary }]}>

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

        <nav aria-label="前後のガイド" className="guide-pager">
          {prev ? (
            <Link href={`/guide/${prev.slug}`} className="btn btn-secondary btn-sm">
              <Icon name="chevronLeft" size={14} /> {prev.summary}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/guide/${next.slug}`} className="btn btn-secondary btn-sm next">
              {next.summary} <Icon name="chevronRight" size={14} />
            </Link>
          ) : <span />}
        </nav>

        <PageCta />
    </PublicShell>
  );
}
