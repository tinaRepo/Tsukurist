"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDays, formatDay, parseDateStr, todayStr } from "@/lib/calendar";
import { Field, Icon } from "@/components/TaskShared";

type Step = { id: number; name: string; days: string };

const DEFAULT_STEPS: Step[] = [
  { id: 1, name: "下書き・ラフ制作", days: "5" },
  { id: 2, name: "確認とフィードバック", days: "2" },
  { id: 3, name: "本制作", days: "7" },
  { id: 4, name: "修正対応", days: "3" },
  { id: 5, name: "最終確認・納品", days: "1" },
];

const isWeekend = (d: string) => [0, 6].includes(parseDateStr(d).getDay());
const diffDays = (a: string, b: string) => Math.round((parseDateStr(a).getTime() - parseDateStr(b).getTime()) / 86400000);
const parseDays = (v: string) => Math.max(1, Math.min(365, Math.floor(Number(v)) || 1));

// 土日を飛ばして n 日さかのぼる
function subBusinessDays(date: string, n: number): string {
  let d = date;
  for (let i = 0; i < n; i++) {
    d = addDays(d, -1);
    while (isWeekend(d)) d = addDays(d, -1);
  }
  return d;
}
const rollBack = (d: string) => { while (isWeekend(d)) d = addDays(d, -1); return d; };

export default function DeadlineCalculator() {
  const [deadline, setDeadline] = useState("");
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [buffer, setBuffer] = useState("2");
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [today, setToday] = useState("");

  // サーバー描画とのずれを避けるため、日付の初期値はマウント後に入れる
  useEffect(() => {
    const t = todayStr();
    setToday(t);
    setDeadline(addDays(t, 35));
  }, []);

  const result = useMemo(() => {
    if (!deadline || steps.length === 0) return null;
    const bufferDays = Math.max(0, Math.min(60, Math.floor(Number(buffer)) || 0));
    const finalEnd = skipWeekends
      ? rollBack(subBusinessDays(deadline, bufferDays))
      : addDays(deadline, -bufferDays);

    let end = finalEnd;
    const rows: { name: string; start: string; end: string; days: number }[] = [];
    for (let i = steps.length - 1; i >= 0; i--) {
      const days = parseDays(steps[i].days);
      const start = skipWeekends ? subBusinessDays(end, days - 1) : addDays(end, -(days - 1));
      rows.unshift({ name: steps[i].name || `工程${i + 1}`, start, end, days });
      end = skipWeekends ? subBusinessDays(start, 1) : addDays(start, -1);
    }
    return { rows, finalEnd, startDate: rows[0].start };
  }, [deadline, steps, buffer, skipWeekends]);

  const shortage = result && today ? diffDays(today, result.startDate) : 0;
  const update = (id: number, patch: Partial<Step>) => setSteps(s => s.map(x => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ padding: 18, display: "grid", gap: 16 }}>
        <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 160px" }}>
            <Field label="納期（完成してほしい日）">
              <input type="date" className="input input-date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </Field>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <Field label="余裕日数（予備）">
              <input className="input" inputMode="numeric" value={buffer} onChange={e => setBuffer(e.target.value.replace(/[^0-9]/g, ""))} />
            </Field>
          </div>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={skipWeekends} onChange={e => setSkipWeekends(e.target.checked)} style={{ width: 16, height: 16 }} />
          土日を作業日に数えない（祝日は考慮しません）
        </label>

        <div>
          <div className="field-label">工程と日数（上から順に進みます）</div>
          <div style={{ display: "grid", gap: 8 }}>
            {steps.map((s, i) => (
              <div key={s.id} className="row" style={{ gap: 8 }}>
                <span className="text-meta" style={{ width: 18, textAlign: "center" }}>{i + 1}</span>
                <input className="input" value={s.name} placeholder="工程名" onChange={e => update(s.id, { name: e.target.value })} style={{ flex: 1, minWidth: 0 }} />
                <input className="input" inputMode="numeric" value={s.days} aria-label={`${s.name || `工程${i + 1}`}の日数`}
                  onChange={e => update(s.id, { days: e.target.value.replace(/[^0-9]/g, "") })} style={{ width: 64, textAlign: "center" }} />
                <span className="text-meta">日</span>
                <button type="button" className="icon-btn" aria-label="この工程を削除" disabled={steps.length <= 1}
                  onClick={() => setSteps(x => x.filter(y => y.id !== s.id))}
                  style={{ background: "var(--surface-2)", color: "var(--fg)", width: 32, height: 32, flexShrink: 0 }}>
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-secondary btn-sm" disabled={steps.length >= 10}
              onClick={() => setSteps(x => [...x, { id: Date.now(), name: "", days: "1" }])}>
              <Icon name="plus" size={14} /> 工程を追加
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSteps(DEFAULT_STEPS)}>初期値に戻す</button>
          </div>
        </div>
      </div>

      {result && (
        <div className="card" style={{ padding: 18 }} aria-live="polite">
          <div className="text-meta" style={{ marginBottom: 4 }}>依頼を出す（着手してもらう）最終日</div>
          <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>{formatDay(result.startDate)}</div>
          {today && shortage > 0 ? (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
              この日はすでに過ぎています。今日から始めると約{shortage}日足りません。納期を後ろにずらすか、工程の日数を見直してください。
            </div>
          ) : (
            today && <div className="text-muted" style={{ fontSize: 13, marginBottom: 14 }}>今日から数えて、あと{Math.max(0, -shortage)}日の余裕があります。</div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            {result.rows.map((r, i) => (
              <div key={i} className="row" style={{ gap: 10, padding: "10px 12px", background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
                <span className="step-number" style={{ marginTop: 0 }}>{i + 1}</span>
                <span className="grow" style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</span>
                <span style={{ fontSize: 13, color: "var(--fg-2)", textAlign: "right" }}>
                  {r.start === r.end ? formatDay(r.start) : `${formatDay(r.start)} 〜 ${formatDay(r.end)}`}
                </span>
              </div>
            ))}
            <div className="row" style={{ gap: 10, padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600, fontSize: 13, justifyContent: "space-between" }}>
              <span>納期</span><span>{formatDay(deadline)}</span>
            </div>
          </div>
          <p style={{ marginTop: 14, fontSize: 13 }}>
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>この日程をツクリストに登録して、納期が近づいたら通知を受け取る</Link>
          </p>
        </div>
      )}
    </div>
  );
}
