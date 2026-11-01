import Image from "next/image";
import type { ReactNode } from "react";
import { GuestOnly } from "@/components/GuideAuth";

// ガイドページ共通の部品（server componentで使える。"use client"は不要）

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="doc-section" id={title} style={{ scrollMarginTop: 16 }}>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

export function Step({ num, title, children }: { num: number; title: string; children: ReactNode }) {
  return (
    <div className="step-row">
      <div className="step-number">{num}</div>
      <div>
        <div className="step-title">{title}</div>
        <div className="step-body">{children}</div>
      </div>
    </div>
  );
}

// .doc-section p は余白を持たないため、段落とリストの下余白をここで揃える
export function P({ children }: { children: ReactNode }) {
  return <p style={{ margin: "0 0 12px" }}>{children}</p>;
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul style={{ margin: "0 0 12px" }}>{children}</ul>;
}

// 補足・注意用のコールアウト
export function Note({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  return (
    <div style={{
      background: tone === "warn" ? "var(--warn-soft)" : "var(--accent-soft)",
      color: tone === "warn" ? "var(--warn)" : "var(--accent)",
      borderRadius: "var(--radius-md)", padding: "14px 16px", margin: "12px 0", fontSize: 13, lineHeight: 1.8,
    }}>
      {children}
    </div>
  );
}

// 長い説明を折りたたむ（本文はHTMLに残るので、検索エンジンからは読める）
export function Fold({ title = "詳しく読む", children }: { title?: string; children: ReactNode }) {
  return (
    <details style={{ margin: "4px 0 12px" }}>
      <summary style={{ cursor: "pointer", color: "var(--accent)", fontWeight: 600, fontSize: 14, padding: "8px 0" }}>{title}</summary>
      <div style={{ paddingTop: 8 }}>{children}</div>
    </details>
  );
}

// ページ冒頭の目次（Sectionのtitleをidにしているので、そのままアンカーになる）
export function Toc({ titles }: { titles: string[] }) {
  if (titles.length < 3) return null;
  return (
    <nav aria-label="このページの内容" className="card" style={{ padding: "14px 18px", marginBottom: 28 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>このページの内容</div>
      <ul style={{ display: "grid", gap: 6, listStyle: "none" }}>
        {titles.map(t => (
          <li key={t} style={{ fontSize: 14 }}>
            <a href={`#${encodeURIComponent(t)}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{t}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ページ途中に挟む「デモで試す」誘導（ログイン中は表示しない）
export function InlineCta() {
  return (
    <GuestOnly>
      <div className="card row" style={{ padding: "14px 18px", gap: 12, justifyContent: "space-between", flexWrap: "wrap", margin: "8px 0 32px" }}>
        <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6 }}>読むより触るほうが早いときは、登録なしのデモをどうぞ。</span>
        <a href="/demo" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>デモを試す</a>
      </div>
    </GuestOnly>
  );
}

// 実際のスクリーンショット・操作GIF用。画像は public/guide/ に置き、src="/guide/xxx.png" のように指定する。
// width / height は画像の実寸（ピクセル）。表示サイズではなく、レイアウトのずれ防止と縦横比の指定に使う。
// maxWidth を指定すると、その幅（px）を上限に中央寄せで表示する（スマホ画面の縦長スクショ向け）。
export function Shot({ src, alt, width, height, caption, maxWidth }: {
  src: string; alt: string; width: number; height: number; caption?: string; maxWidth?: number;
}) {
  return (
    <figure style={{ margin: "0 auto 16px", maxWidth }}>
      <Image src={src} alt={alt} width={width} height={height} sizes={`(max-width: 720px) 100vw, ${maxWidth ?? 672}px`}
        unoptimized={src.endsWith(".gif")}
        style={{ width: "100%", height: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)" }} />
      {caption && <figcaption className="text-meta" style={{ marginTop: 8, lineHeight: 1.7 }}>{caption}</figcaption>}
    </figure>
  );
}
