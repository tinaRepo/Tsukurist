"use client";

import Link from "next/link";
import { useIsLoggedIn } from "@/components/GuideAuth";

// /guide・/tools 共通のヘッダー。
// 履歴に頼る「戻る」ボタンではなく、行き先が決まっているサイト内メニューにする
// （ロゴ→トップ、使い方、無料ツール、ログイン／アプリを開く）。
const NAV = [
  { key: "guide", href: "/guide", label: "使い方" },
  { key: "tools", href: "/tools", label: "無料ツール" },
] as const;

export default function PublicHeader({ current }: { current?: "guide" | "tools" }) {
  const loggedIn = useIsLoggedIn();
  return (
    <header className="doc-header" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "8px 16px" }}>
      <Link href="/" className="title" style={{ textDecoration: "none" }}>ツクリスト</Link>
      <nav aria-label="サイト内メニュー" className="row" style={{ gap: 16 }}>
        {NAV.map(n => (
          <Link key={n.key} href={n.href} aria-current={current === n.key ? "page" : undefined}
            style={{
              fontSize: 13, textDecoration: "none", fontWeight: current === n.key ? 600 : 400,
              color: current === n.key ? "var(--fg-on-inverse)" : "var(--muted-on-inverse)",
            }}>
            {n.label}
          </Link>
        ))}
        {/* 判定前は同じ大きさの見えないボタンで場所だけ確保する */}
        <Link href={loggedIn ? "/" : "/login"} className="btn btn-inverse btn-sm"
          style={{ textDecoration: "none", visibility: loggedIn === null ? "hidden" : "visible" }}>
          {loggedIn ? "アプリを開く" : "ログイン"}
        </Link>
      </nav>
    </header>
  );
}
