"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

// ============================================================
// 公開ページ（/guide・/tools）で、ログイン状態に応じて表示を切り替える部品。
// 公開ページは静的に生成して配信したいので、サーバー側では判定せず、
// マウント後にブラウザのCookieから判定する（app/page.tsx と同じ「認証Cookieがあればログイン中」の判定。
// 検証はしない。表示を出し分けるだけで、データの保護はRLSが担っている）。
// ============================================================

// null = 判定前 / true = ログイン中 / false = 未ログイン
export function useIsLoggedIn(): boolean | null {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    setLoggedIn(document.cookie.split("; ").some(cookie => {
      const name = cookie.split("=")[0];
      return /^sb-.+-auth-token/.test(name) && !name.endsWith("code-verifier");
    }));
  }, []);
  return loggedIn;
}

// 未ログインのときだけ子要素を表示する（「無料で始める」などの登録誘導用）
export function GuestOnly({ children }: { children: ReactNode }) {
  return useIsLoggedIn() === false ? <>{children}</> : null;
}

// ページ末尾の行動ボタン。未ログイン: デモ + 無料で始める / ログイン中: タスク一覧へ
export function PageCta() {
  const loggedIn = useIsLoggedIn();
  if (loggedIn === null) return <div style={{ minHeight: 44, marginTop: 40 }} />; // 判定前の高さ確保
  return (
    <div className="row" style={{ justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 40 }}>
      {loggedIn ? (
        <Link href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>タスク一覧を開く</Link>
      ) : (
        <>
          <Link href="/demo" className="btn btn-secondary" style={{ textDecoration: "none" }}>デモを試す</Link>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>無料で始める</Link>
        </>
      )}
    </div>
  );
}
