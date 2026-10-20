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
    "納期・タスク管理ツール",
    "依頼状況・納期・金額・画像をまとめて管理。外注・依頼を整理できる無料の納期管理ツールです。",
    "/"
  );
}

export default function Home() {
  return hasAuthCookie() ? <TaskApp /> : <LandingPage />;
}