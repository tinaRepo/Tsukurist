"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/TaskShared";

// 同じサイト内から来た場合は1つ前へ、直接アクセス（検索結果・外部リンク）の場合は "/" へ。
// "/" は認証Cookieの有無でアプリ（ログイン中）かLP（未ログイン）を出し分ける。
export default function BackButton({ label = "戻る" }: { label?: string }) {
    const router = useRouter();

    function handleClick() {
        const cameFromSameSite = (() => {
            try {
                return !!document.referrer && new URL(document.referrer).origin === window.location.origin;
            } catch {
                return false;
            }
        })();

        if (cameFromSameSite && window.history.length > 1) router.back();
        else router.push("/");
    }

    return (
        <button onClick={handleClick} className="doc-back-btn">
            <Icon name="arrowLeft" size={14} /> {label}
        </button>
    );
}