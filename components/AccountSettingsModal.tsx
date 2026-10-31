"use client";

import { useEffect, useRef } from "react";
import { Icon, type IconName } from "./TaskShared";

// ============================================================
// アカウント設定モーダル（名前・パスワード・Google連携・アカウント削除）
// ユーザーメニューが長くなりすぎないよう、アカウント系の操作をここに集約する。
// 各操作の実処理は TaskApp 側にあり、ここでは「どれを開くか」を選ぶだけ。
// 押した項目の処理は、親（TaskApp）がこのモーダルを閉じてから実行する。
// ※ 背景スクロールのロックは TaskApp の useEffect で行う
// ============================================================

type Props = {
  open: boolean;
  onClose: () => void;
  online?: boolean;
  hasPassword: boolean;
  isGoogleLinked: boolean;
  linking: boolean;
  isAdmin: boolean;
  onEditName: () => void;
  onPassword: () => void;
  onLinkGoogle: () => void;
  onUnlinkGoogle: () => void;
  onDeleteAccount: () => void;
};

export default function AccountSettingsModal({
  open, onClose, online = true, hasPassword, isGoogleLinked, linking, isAdmin,
  onEditName, onPassword, onLinkGoogle, onUnlinkGoogle, onDeleteAccount,
}: Props) {
  // 親が毎回新しい onClose を渡しても、キー入力の登録をやり直さないよう ref で最新の関数を保持する
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  const offlineTitle = !online ? "オンライン復帰後に利用できます" : undefined;
  const item = (
    icon: IconName, label: string, onClick: () => void,
    opts: { disabled?: boolean; danger?: boolean } = {},
  ) => (
    <button key={label} onClick={onClick} disabled={!online || opts.disabled} title={offlineTitle}
      className={opts.danger ? "user-menu-item danger" : "user-menu-item"} style={{ minHeight: 48 }}>
      <span className="user-menu-item-icon"><Icon name={icon} size={17} /></span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="アカウント設定" className="modal-compact"
        style={{ maxWidth: 400, textAlign: "left", maxHeight: "calc(100dvh - 32px)", overflowY: "auto", overscrollBehavior: "contain" }}
        onClick={e => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 17 }}>アカウント設定</span>
          <button onClick={onClose} className="icon-btn" aria-label="閉じる"
            style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", color: "var(--fg)", width: 32, height: 32 }}>
            <Icon name="close" size={14} />
          </button>
        </div>

        {!online && (
          <div role="status" style={{ marginBottom: 12, padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: 13, background: "var(--warn-soft)", color: "var(--warn)" }}>
            アカウント設定の変更はオンライン復帰後に利用できます。
          </div>
        )}

        <div className="field-label">プロフィール・ログイン</div>
        <div className="settings-list" style={{ marginBottom: 20 }}>
          {item("user", "名前を変更", onEditName)}
          {item("lock", hasPassword ? "パスワードを変更" : "パスワードを設定", onPassword)}
          {isGoogleLinked
            ? item("link", "Google連携を解除", onUnlinkGoogle)
            : item("link", linking ? "連携中…" : "Googleと連携する", onLinkGoogle, { disabled: linking })}
        </div>

        {!isAdmin && (
          <>
            <div className="field-label">アカウントの削除</div>
            <div className="settings-list">
              {item("trash", "アカウントを削除", onDeleteAccount, { danger: true })}
            </div>
            <div className="text-meta" style={{ marginTop: 8, lineHeight: 1.6 }}>
              すべてのデータが削除され、元に戻せません。
            </div>
          </>
        )}
      </div>
    </div>
  );
}
