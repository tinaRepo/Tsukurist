"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Icon } from "./TaskShared";

// 納期プッシュ通知の時刻（日本時間・0〜23時）の設定。user_settings.notify_hour に保存する。
// アカウント共通の設定（端末ごとではない）。Cronは毎時起動し、この時刻のユーザーにだけ送る。
const DEFAULT_HOUR = 8;

export default function NotifyHourSelect({ userId, enabled = true }: { userId: string | null; enabled?: boolean }) {
  const [hour, setHour] = useState(DEFAULT_HOUR);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase.from("user_settings").select("notify_hour").eq("user_id", userId).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (typeof data?.notify_hour === "number") setHour(data.notify_hour);
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [userId]);

  async function change(next: number) {
    if (!userId || !enabled) return;
    const previous = hour;
    setHour(next);
    setSaving(true);
    setMessage(null);
    // last_seen_release_id など他の列は上書きしない（指定した列だけ更新される）
    const { error } = await supabase.from("user_settings")
      .upsert({ user_id: userId, notify_hour: next }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setHour(previous);
      setMessage({ ok: false, text: "保存できませんでした" });
    } else {
      setMessage({ ok: true, text: "保存しました" });
      setTimeout(() => setMessage(null), 2500);
    }
  }

  if (!userId) return null;

  return (
    <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--divider)" }}>
      <label className="row" style={{ gap: 12, fontSize: 14 }}>
        <span className="user-menu-item-icon"><Icon name="bell" size={17} /></span>
        <span className="grow" style={{ whiteSpace: "nowrap" }}>通知時刻（日本時間）</span>
        <select value={hour} disabled={!enabled || !loaded || saving} onChange={e => void change(Number(e.target.value))}
          aria-label="納期通知の時刻" className="select"
          style={{ width: "auto", height: 36, minHeight: 36, padding: "4px 10px" }}>
          {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}時</option>)}
        </select>
      </label>
      {message && (
        <div role="status" style={{ marginTop: 6, fontSize: 11, color: message.ok ? "var(--success)" : "var(--danger)" }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
