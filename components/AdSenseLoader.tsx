"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// ============================================================
// Google AdSense の読み込みを「独自のコンテンツがある公開ページ」だけに限定する。
// ログイン後のアプリ・ログイン画面・エラー/メンテナンス画面に加え、
// 規約・プライバシー・特商法のような定型文だけのページにも広告は出さない
// （「公開コンテンツのない画面への広告」はAdSenseポリシー上のリスクになるため）。
//
// - 所有確認用の <meta name="google-adsense-account"> は app/layout.tsx で全ページに出している
//   （広告は読み込まない。サイト所有の確認専用）
// - スクリプトは next/script ではなく手動で挿入する（next/script は data-nscript 属性を付与し、
//   AdSense側から警告が出るため。docs/seo-ads-guide.md 参照）
// - / は未ログイン時のみ公開ページ。ログイン中はnoindex metadataを見て広告を読み込まない
// ============================================================

const ADSENSE_CLIENT = "ca-pub-4461599437148086";

// 広告を表示してよい公開ページ（完全一致）。/pricing はログインが必要なため含めない
export const AD_ALLOWED_PATHS = ["/", "/guide", "/tools"];
// 広告を表示してよい公開ページ（前方一致）。使い方ガイド・無料ツールの各ページ
export const AD_ALLOWED_PREFIXES = ["/guide/", "/tools/"];

const isAdAllowed = (pathname: string) =>
  AD_ALLOWED_PATHS.includes(pathname) || AD_ALLOWED_PREFIXES.some(prefix => pathname.startsWith(prefix));

export default function AdSenseLoader() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isAdAllowed(pathname)) return;
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content");
    if (pathname === "/" && robots?.split(",").some(value => value.trim() === "noindex")) return;

    const w = window as unknown as { __adsenseLoaded?: boolean };
    if (w.__adsenseLoaded) return;
    w.__adsenseLoaded = true;

    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    document.head.appendChild(s);
  }, [pathname]);

  return null;
}
