import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import Breadcrumb, { type Crumb } from "@/components/Breadcrumb";

// 公開ページ共通の枠：共通ヘッダー → パンくずの帯 → 本文。
// 新しい公開ページ（LP以外）は、これで包むだけで同じヘッダー・パンくずになる。
export default function PublicShell({ current, crumbs, title, description, children }: {
  current?: "guide" | "tools"; crumbs: Crumb[]; title?: string; description?: string; children: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <SiteHeader current={current} />
      <Breadcrumb items={crumbs} />
      {title && (
        <header className="app-header public-page-header">
          <div className="brand">
            <h1 className="public-page-title">{title}</h1>
            {description && <p className="public-page-description">{description}</p>}
          </div>
        </header>
      )}
      <main className="public-main">{children}</main>
    </div>
  );
}
