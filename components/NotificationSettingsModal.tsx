"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./TaskShared";
import PushNotificationToggle from "./PushNotificationToggle";
import NotifyHourSelect from "./NotifyHourSelect";

export default function NotificationSettingsModal({ open, onClose, userId, online }: {
  open: boolean; onClose: () => void; userId: string | null; online: boolean;
}) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay notification-settings-overlay" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="notification-settings-title"
        className="notification-settings-dialog" onClick={event => event.stopPropagation()}>
        <div className="notification-settings-header">
          <div>
            <h2 id="notification-settings-title" style={{ fontSize: 18 }}>通知設定</h2>
            <p className="text-meta" style={{ marginTop: 4, fontSize: 13 }}>
              通知を受け取る端末と、納期のお知らせを設定できます。
            </p>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="通知設定を閉じる"
            style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", color: "var(--fg)", width: 36, height: 36 }}>
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="notification-settings-body">
          {!online && (
            <div role="status" style={{ margin: "0 16px 12px", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--warn-soft)", color: "var(--warn)", fontSize: 13, lineHeight: 1.6 }}>
              通知設定の変更はオンライン復帰後に利用できます。
            </div>
          )}
          <section aria-labelledby="push-settings-heading">
            <h3 id="push-settings-heading" className="notification-settings-section-title">この端末の通知</h3>
            <PushNotificationToggle enabled={online} />
            <p className="notification-settings-help">
              オン／オフは、このブラウザで使っている端末にのみ反映されます。
            </p>
          </section>
          <section aria-labelledby="deadline-settings-heading" className="notification-settings-deadline">
            <h3 id="deadline-settings-heading" className="notification-settings-section-title">納期のお知らせ</h3>
            <NotifyHourSelect userId={userId} enabled={online} />
            <p className="notification-settings-help">
              通知時刻と何日前に知らせるかは、アカウント共通の設定です。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
