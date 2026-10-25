import type { ReactNode } from "react";

// ガイドページ共通の部品（server componentで使える。"use client"は不要）

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="doc-section">
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
