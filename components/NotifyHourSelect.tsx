"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_NOTIFY_DAYS, NOTIFY_DAY_OPTIONS, formatDaysBefore, normalizeNotifyDays } from "@/lib/notify";
import { Icon, cx } from "./TaskShared";

// 納期プッシュ通知の設定（通知時刻・通知する日）。user_settings の notify_hour / notify_days に保存する。
//   通知時刻（日本時間・0〜23時）: Cronは毎時起動し、この時刻のユーザーにだけ送る
//   通知する日: 納期の「何日前」に通知するか（0=当日）。空にすると納期の自動通知は止まる
// どちらもアカウント共通の設定（端末ごとではない）。
const DEFAULT_HOUR = 8;

export default function NotifyHourSelect({ userId, enabled = true }: { userId: string | null; enabled?: boolean }) {
  const [hour, setHour] = useState(DEFAULT_HOUR);
  const [days, setDays] = useState<number[]>([...DEFAULT_NOTIFY_DAYS]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase.from("user_settings").select("notify_hour, notify_days").eq("user_id", userId).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (typeof data?.notify_hour === "number") setHour(data.notify_hour);
        if (data) setDays(normalizeNotifyDays(data.notify_days));
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [userId]);

  // last_seen_release_id など他の列は上書きしない（指定した列だけ更新される）
  async function persist(values: { notify_hour?: number; notify_days?: number[] }, revert: () => void) {
    if (!userId || !enabled) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from("user_settings")
      .upsert({ user_id: userId, ...values }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      revert();
      setMessage({ ok: false, text: "保存できませんでした" });
    } else {
      setMessage({ ok: true, text: "保存しました" });
      setTimeout(() => setMessage(null), 2500);
    }
  }

  function changeHour(next: number) {
    const previous = hour;
    setHour(next);
    void persist({ notify_hour: next }, () => setHour(previous));
  }

  function toggleDay(day: number) {
    const previous = days;
    const next = (previous.includes(day) ? previous.filter(d => d !== day) : [...previous, day]).sort((a, b) => a - b);
    setDays(next);
    void persist({ notify_days: next }, () => setDays(previous));
  }

  if (!userId) return null;
  const locked = !enabled || !loaded || saving;

  return (
    <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--divider)" }}>
      <label className="row" style={{ gap: 12, fontSize: 14 }}>
        <span className="user-menu-item-icon"><Icon name="bell" size={17} /></span>
        <span className="grow" style={{ whiteSpace: "nowrap" }}>通知時刻（日本時間）</span>
        <select value={hour} disabled={locked} onChange={e => changeHour(Number(e.target.value))}
          aria-label="納期通知の時刻" className="select"
          style={{ width: "auto", height: 36, minHeight: 36, padding: "4px 10px" }}>
          {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}時</option>)}
        </select>
      </label>

      <div role="group" aria-label="納期の何日前に通知するか" style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>通知する日（納期の何日前か）</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {NOTIFY_DAY_OPTIONS.map(d => (
            <button key={d} type="button" disabled={locked} aria-pressed={days.includes(d)}
              onClick={() => toggleDay(d)}
              className={cx("btn", "btn-sm", days.includes(d) ? "btn-primary" : "btn-secondary")}
              style={{ padding: "6px 0" }}>
              {formatDaysBefore(d)}
            </button>
          ))}
        </div>
        <div className="text-meta" style={{ marginTop: 6, lineHeight: 1.5 }}>
          {days.length === 0
            ? "納期の自動通知はオフです（タスク個別のリマインドは届きます）"
            : "選んだ日にだけ通知します。個別リマインドはこれとは別に届きます"}
        </div>
      </div>

      {message && (
        <div role="status" style={{ marginTop: 6, fontSize: 11, color: message.ok ? "var(--success)" : "var(--danger)" }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
