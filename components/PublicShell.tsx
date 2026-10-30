import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import Breadcrumb, { type Crumb } from "@/components/Breadcrumb";

// 公開ページ共通の枠：共通ヘッダー → パンくずの帯 → 本文。
// 新しい公開ページ（LP以外）は、これで包むだけで同じヘッダー・パンくずになる。
export default function PublicShell({ current, crumbs, children }: {
  current?: "guide" | "tools"; crumbs: Crumb[]; children: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <SiteHeader current={current} />
      <Breadcrumb items={crumbs} />
      <main className="public-main">{children}</main>
    </div>
  );
}
