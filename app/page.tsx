import { cookies } from "next/headers";
import type { Metadata } from "next";
import TaskApp from "@/components/TaskApp";
import LandingPage from "@/components/LandingPage";
import { createPublicPageMetadata, noIndexMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Supabaseの認証Cookie（sb-xxx-auth-token[.n]）があればログイン中とみなす。
// 検証はしない（JWT期限切れでもTaskApp側が更新・/loginへ誘導する。データはRLSで保護）。
function hasAuthCookie(): boolean {
  return cookies().getAll().some(c =>
    /^sb-.+-auth-token/.test(c.name) && !c.name.endsWith("code-verifier")
  );
}

export function generateMetadata(): Metadata {
  if (hasAuthCookie()) {
    return { ...noIndexMetadata, title: { absolute: "タスク管理 | ツクリスト" } };
  }
  return createPublicPageMetadata(
    "納期管理ツール｜外注・依頼のタスク管理",
    "ツクリストは、外注・依頼の納期、金額、確認用画像をまとめて管理できる無料の納期管理Webアプリ。スマホ対応、納期7日前の通知付き。登録1分・カード不要。",
    "/"
  );
}

export default function Home() {
  return hasAuthCookie() ? <TaskApp /> : <LandingPage />;
}