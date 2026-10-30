"use client";

import Link from "next/link";
import { useIsLoggedIn } from "@/components/GuideAuth";
import "@/app/public-pages.css";

// 公開ページ共通のヘッダー（LP・/guide・/tools・/terms・/privacy・/tokusho）。
// 左: ロゴ（トップへ） / 右: 使い方・無料ツール・ログイン（ログイン中は「アプリを開く」）。
// 「ログイン」と「無料で始める」は同じ行き先（/login。登録もそこで切り替える）なので、ヘッダーではボタンを1つにしている。
// スマホ幅（320px〜）でも1行に収まるよう、文字サイズ・余白は app/public-pages.css で段階的に詰める。
const NAV = [
  { key: "guide", href: "/guide", label: "使い方" },
  { key: "tools", href: "/tools", label: "無料ツール" },
] as const;

export default function SiteHeader({ current, wide = false }: { current?: "guide" | "tools"; wide?: boolean }) {
  const loggedIn = useIsLoggedIn();
  return (
    <header className="site-header">
      <div className={wide ? "site-header-inner wide" : "site-header-inner"}>
        <Link href="/" className="site-header-logo">ツクリスト</Link>
        <nav aria-label="サイト内メニュー" className="site-header-nav">
          {NAV.map(n => (
            <Link key={n.key} href={n.href} className="site-header-link"
              aria-current={current === n.key ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
          {/* 判定前は同じ大きさの見えないボタンで場所だけ確保する */}
          <Link href={loggedIn ? "/" : "/login"} className="btn btn-primary btn-sm site-header-cta"
            style={{ visibility: loggedIn === null ? "hidden" : "visible" }}>
            {loggedIn ? "アプリを開く" : "ログイン"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
