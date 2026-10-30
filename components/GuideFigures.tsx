"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Tag } from "@/lib/supabase";
import { addDays, todayStr } from "@/lib/calendar";
import {
  Icon, StatusBadge, TaskListCard, Field, DateRangeField, cx, type IconName,
} from "@/components/TaskShared";
import TaskCalendar from "@/components/TaskCalendar";
import { TagPicker } from "@/components/TagPicker";

// ============================================================
// ガイド用の図。実画面と同じ共通クラス・共通コンポーネント
// （TaskListCard / StatusBadge / TaskCalendar / TagPicker / Field など）をそのまま使い、
// ダミーデータを入れて「操作できない見本」として表示する。
// UIを変更すると、ガイドの図も自動で追従する。
// 日付に依存する図は、サーバー描画とのずれを避けるためマウント後に描画する。
// ============================================================

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

// ---- 共通の枠・部品 ----
export function Figure({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure style={{ margin: "0 0 16px" }}>
      <div aria-hidden="true" style={{
        border: "1px solid var(--border-soft)", borderRadius: "var(--radius-lg)", background: "var(--surface)",
        padding: 14, pointerEvents: "none", userSelect: "none", overflow: "hidden",
      }}>
        {children}
      </div>
      <figcaption className="text-meta" style={{ marginTop: 8, lineHeight: 1.7 }}>{caption}</figcaption>
    </figure>
  );
}

// 図の中の番号マーカー
function Mk({ n }: { n: number }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      width: 18, height: 18, borderRadius: "50%", background: "var(--accent-fill)", color: "var(--on-accent)",
      fontSize: 11, fontWeight: 600,
    }}>{n}</span>
  );
}

function Legend({ items }: { items: string[] }) {
  return (
    <div style={{ display: "grid", gap: 6, marginTop: 12, fontSize: 12, color: "var(--fg-2)" }}>
      {items.map((t, i) => (
        <div key={i} className="row" style={{ gap: 8, alignItems: "flex-start" }}><Mk n={i + 1} /><span>{t}</span></div>
      ))}
    </div>
  );
}

// 手順の流れ図
export function Flow({ steps }: { steps: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, margin: "0 0 16px" }}>
      {steps.map((s, i) => (
        <span key={i} style={{ display: "contents" }}>
          <span className="card" style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, display: "inline-flex", gap: 8, alignItems: "center" }}>
            <Mk n={i + 1} />{s}
          </span>
          {i < steps.length - 1 && (
            <span style={{ color: "var(--meta)", display: "inline-flex" }}><Icon name="chevronRight" size={16} /></span>
          )}
        </span>
      ))}
    </div>
  );
}

// ---- 画面全体：ヘッダー ----
export function FigHeader() {
  return (
    <Figure caption="ログイン後のヘッダー。番号の位置を覚えておくと、迷いません。">
      <div className="app-header" style={{ borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
        <div className="brand">
          <div style={{ fontSize: 16, fontWeight: 600 }}>ツクリスト</div>
          <div className="tagline">納期管理</div>
        </div>
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <div className="row" style={{ gap: 6 }}>
            <Mk n={1} />
            {[["合計", 5], ["進行中", 3], ["完成", 2]].map(([l, v]) => (
              <div key={l as string} className="stat-block" style={{ minWidth: 36 }}>
                <div className="stat-value">{v}</div><div className="stat-label">{l}</div>
              </div>
            ))}
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-md)", padding: "6px 10px", minWidth: 110 }}>
              <div style={{ fontSize: 10, color: "var(--muted-on-inverse)", marginBottom: 3 }}>画像 3 / 10枚</div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.14)", borderRadius: 99 }}>
                <div style={{ height: "100%", width: "30%", background: "var(--accent)", borderRadius: 99 }} />
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Mk n={2} />
            <span className="icon-btn"><Icon name="mail" size={17} /></span>
            <span className="icon-btn"><Icon name="refresh" size={17} /></span>
            <span className="icon-btn" style={{ position: "relative" }}>
              <Icon name="bell" size={17} />
              <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 999, background: "var(--danger)", color: "#fff", fontSize: 9, fontWeight: 600, lineHeight: "16px", textAlign: "center" }}>2</span>
            </span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Mk n={3} />
            <span className="btn btn-primary btn-sm"><Icon name="plus" size={15} /> 新規登録</span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Mk n={4} />
            <span className="row" style={{ gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-on-inverse)", borderRadius: 999, padding: "6px 12px 6px 6px", color: "var(--fg-on-inverse)", fontSize: 13, fontWeight: 600 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent-fill)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>Y</span>
              山田太郎 <Icon name="chevronDown" size={13} />
            </span>
          </div>
        </div>
      </div>
      <Legend items={[
        "件数（合計・進行中・完成）と画像の使用量",
        "お問い合わせ（封筒）・画面の更新・お知らせ（ベル）",
        "タスクを追加する「新規登録」",
        "プラン・通知・タグ・パスワードなどのユーザーメニュー",
      ]} />
    </Figure>
  );
}

// ---- 登録フォーム ----
export function FigTaskForm() {
  const ro = { readOnly: true, tabIndex: -1 } as const;
  return (
    <Figure caption="「新規登録」で開くフォーム。赤い * の付いた「件名」と「依頼先名」だけが必須です。">
      <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 180px" }}><Field label="件名 *"><input className="input" value="名刺デザイン一式" {...ro} /></Field></div>
          <div style={{ flex: "1 1 180px" }}><Field label="依頼先名 *"><input className="input" value="田中デザイン事務所" {...ro} /></Field></div>
        </div>
        <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 120px" }}><Field label="納期"><input className="input" value="2026/11/05" {...ro} /></Field></div>
          <div style={{ flex: "1 1 120px" }}><Field label="金額（円）"><input className="input" value="5,000" {...ro} /></Field></div>
          <div style={{ flex: "1 1 120px" }}>
            <Field label="ステータス"><select className="select" value="pending" disabled><option value="pending">依頼済み</option></select></Field>
          </div>
        </div>
        <Field label="メモ"><textarea className="textarea" style={{ minHeight: 48 }} value="修正は2回まで。支払いは納品後。" {...ro} /></Field>
        <div className="row" style={{ gap: 10 }}>
          <span className="btn btn-secondary" style={{ flex: 1 }}>キャンセル</span>
          <span className="btn btn-primary" style={{ flex: 2 }}>登録する</span>
        </div>
      </div>
    </Figure>
  );
}

// ---- ステータスの流れ ----
export function FigStatusFlow() {
  const items: [Parameters<typeof StatusBadge>[0]["status"], string][] = [
    ["pending", "相手の返事待ち"], ["checking", "自分が確認"], ["progress", "相手が作業"],
    ["done", "納品・検収済み"], ["cancelled", "取りやめ"],
  ];
  return (
    <Figure caption="迷ったら「いまボールを持っているのは誰か」で決めます。確認中だけが自分の番です。">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {items.map(([s, note], i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ textAlign: "center" }}>
              <StatusBadge status={s} />
              <div className="text-meta" style={{ marginTop: 6, fontSize: 11 }}>{note}</div>
            </div>
            {i < 3 && <span style={{ color: "var(--meta)", display: "inline-flex" }}><Icon name="chevronRight" size={14} /></span>}
          </div>
        ))}
      </div>
    </Figure>
  );
}

// ---- 一覧カード（実コンポーネント） ----
export function FigTaskCards({ only }: { only?: "alert" }) {
  const mounted = useMounted();
  if (!mounted) return <div style={{ minHeight: 120 }} />;
  const t = todayStr();
  const noop = () => { };
  return (
    <Figure caption="赤い枠は「納期7日以内」または「納期超過」。右側に残り日数が出ます。">
      <div style={{ display: "grid", gap: 10 }}>
        <TaskListCard title="名刺デザイン一式" assigneeName="田中デザイン事務所" contact="@tanaka_d" status="progress"
          deadline={addDays(t, 2)} price={5000} imageCount={2} onClick={noop} tags={[{ id: "1", name: "緊急" }]} />
        {!only && (
          <TaskListCard title="紹介動画の編集" assigneeName="スタジオみらい" status="checking"
            deadline={addDays(t, 20)} price={12000} imageCount={0} onClick={noop} />
        )}
        <TaskListCard title="バナー制作" assigneeName="フリーランス佐藤" status="pending"
          deadline={addDays(t, -3)} price={3500} imageCount={0} onClick={noop} />
      </div>
    </Figure>
  );
}

// ---- タグ（実コンポーネント） ----
export function FigTagPicker() {
  const tags: Tag[] = [
    { id: "a", name: "緊急", created_at: "" }, { id: "b", name: "A社", created_at: "" },
    { id: "c", name: "春キャンペーン", created_at: "" },
  ];
  const [sel, setSel] = useState<string[]>(["a", "b"]);
  return (
    <Figure caption="フォームの「タグ」欄。既存タグはプルダウンから選び、新しいタグは入力して「追加」します。">
      <div className="card" style={{ padding: 16 }}>
        <TagPicker tags={tags} selectedIds={sel} onChange={setSel}
          onCreate={async name => ({ id: name, name, created_at: "" })} />
      </div>
    </Figure>
  );
}

// ---- 検索バー ----
export function FigSearchBar() {
  return (
    <Figure caption="一覧の上の操作。ステータス・タグで絞り込み、並び替えは右側です。">
      <div className="task-search-controls row" style={{ gap: 8, flexWrap: "wrap" }}>
        <select className="select task-search-select" style={{ width: "auto", fontWeight: 600 }} disabled><option>すべてのステータス</option></select>
        <select className="select task-search-select" style={{ width: "auto", fontWeight: 600 }} disabled><option>すべてのタグ</option></select>
        <span className="btn btn-secondary btn-sm">詳細検索 <Icon name="chevronDown" size={12} /></span>
        <div className="row" style={{ gap: 6, marginLeft: "auto" }}>
          <select className="select task-search-select" style={{ width: "auto" }} disabled><option>納期順</option></select>
          <span className="btn btn-secondary btn-sm"><Icon name="chevronUp" size={14} /> 昇順</span>
        </div>
      </div>
    </Figure>
  );
}

export function FigDetailPanel() {
  const noop = () => { };
  return (
    <Figure caption="「詳細検索」を開いたところ。条件を入れると、合計金額と件数が下に出ます。">
      <div className="panel" style={{ padding: "16px 18px", display: "grid", gap: 14 }}>
        <Field label="件名（部分一致）"><input className="input" value="バナー" readOnly tabIndex={-1} /></Field>
        <DateRangeField label="納期" from="2026-11-01" to="2026-11-30" onFromChange={noop} onToChange={noop} />
        <Field label="金額（円）">
          <div className="row" style={{ gap: 8 }}>
            <input className="input" value="10000" readOnly tabIndex={-1} style={{ flex: 1 }} />
            <span className="text-meta">〜</span>
            <input className="input" placeholder="上限" readOnly tabIndex={-1} style={{ flex: 1 }} />
          </div>
        </Field>
        <label className="checkbox-row"><input type="checkbox" checked readOnly style={{ width: 16, height: 16 }} />検索結果の合計金額を表示する</label>
        <div className="row" style={{ padding: "10px 16px", background: "var(--accent-soft)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--accent)", fontWeight: 600, justifyContent: "space-between" }}>
          <span>検索結果の合計金額</span><span>18,500 円（該当 3 件）</span>
        </div>
      </div>
    </Figure>
  );
}

// ---- カレンダー（実コンポーネント） ----
export function FigCalendar() {
  const mounted = useMounted();
  if (!mounted) return <div style={{ minHeight: 380 }} />;
  const t = todayStr();
  const tasks = [
    { id: "1", title: "名刺デザイン一式", deadline: addDays(t, 0), status: "progress" as const, assignee_name: "田中デザイン事務所" },
    { id: "2", title: "紹介動画の編集", deadline: addDays(t, 3), status: "checking" as const, assignee_name: "スタジオみらい" },
    { id: "3", title: "バナー制作", deadline: addDays(t, 3), status: "pending" as const, assignee_name: "フリーランス佐藤" },
    { id: "4", title: "ロゴ修正", deadline: addDays(t, 8), status: "done" as const, assignee_name: "デザイン工房" },
  ];
  return (
    <Figure caption="カレンダー表示（スタンダード以上）。点の色はステータス、日付を押すとその日のタスクが一覧されます。">
      <TaskCalendar tasks={tasks} onSelect={() => { }} />
    </Figure>
  );
}

// ---- 画像 ----
export function FigImages() {
  const types = ["確認用", "作業中", "完成", "その他"];
  return (
    <Figure caption="タスク詳細の「添付画像」。種類を選んで「画像を追加」します。種類は左上のラベルで区別できます。">
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
          {types.map(t => (
            <div key={t} style={{ position: "relative", aspectRatio: "1", borderRadius: "var(--radius-md)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--meta)" }}>
              <Icon name="image" size={22} />
              <span className="tag" style={{ position: "absolute", top: 4, left: 4 }}>{t}</span>
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select className="select" style={{ width: "auto", padding: "8px 12px" }} disabled><option>確認用</option></select>
          <span className={cx("btn", "btn-secondary", "grow")} style={{ borderStyle: "dashed" }}>画像を追加</span>
        </div>
      </div>
    </Figure>
  );
}

export function FigLimits() {
  const rows: [string, string, number | null][] = [["無料", "3 / 10枚", 30], ["スタンダード", "18 / 50枚", 36], ["プレミアム", "無制限", null]];
  return (
    <Figure caption="画像の上限は、タスクごとではなくアカウント全体の合計です。">
      <div style={{ display: "grid", gap: 12 }}>
        {rows.map(([label, text, pct]) => (
          <div key={label}>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <strong>{label}</strong><span className="text-muted">{text}</span>
            </div>
            <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 99 }}>
              <div style={{ height: "100%", width: pct === null ? "100%" : `${pct}%`, background: pct === null ? "var(--success)" : "var(--accent)", borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </Figure>
  );
}

// ---- ユーザーメニュー ----
const MENU: { label: string; icon: IconName; tone?: "accent" | "danger" }[] = [
  { label: "プランをアップグレード", icon: "creditCard", tone: "accent" },
  { label: "共有ページを設定", icon: "link" },
  { label: "通知オフ（タップでオン）", icon: "bell" },
  { label: "タグを管理", icon: "tag" },
  { label: "名前を変更", icon: "user" },
  { label: "パスワードを変更", icon: "lock" },
  { label: "Googleと連携する", icon: "link" },
  { label: "アカウントを削除", icon: "trash", tone: "danger" },
  { label: "ログアウト", icon: "logout", tone: "danger" },
];

export function FigUserMenu({ highlight, caption }: { highlight: string[]; caption: string }) {
  return (
    <Figure caption={caption}>
      <div className="user-menu" style={{ position: "static", maxWidth: 280, margin: "0 auto" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>you@example.com</div>
          <span className="badge badge-neutral">無料</span>
        </div>
        {MENU.map(m => {
          const on = highlight.some(h => m.label.includes(h));
          return (
            <div key={m.label} className={cx("user-menu-item", m.tone)} style={on ? { background: "var(--accent-soft)", outline: "2px solid var(--accent)", outlineOffset: -2 } : undefined}>
              <span className="user-menu-item-icon"><Icon name={m.icon} size={17} /></span>
              <span>{m.label}</span>
            </div>
          );
        })}
      </div>
    </Figure>
  );
}

// ---- プッシュ通知・ホーム画面追加 ----
export function FigPush() {
  return (
    <Figure caption="設定した時刻（初期は毎朝8時・日本時間）に届く通知のイメージ。「通知する日」や個別リマインドに当たるタスクがある日だけ届きます。">
      <div style={{ background: "var(--bg)", borderRadius: "var(--radius-lg)", padding: 12, display: "flex", gap: 12, maxWidth: 380, margin: "0 auto", border: "1px solid var(--border-soft)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon0.svg" alt="" width={40} height={40} style={{ borderRadius: 9, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", fontSize: 11, color: "var(--meta)" }}><span>ツクリスト</span><span>8:00</span></div>
          <div style={{ fontWeight: 600, fontSize: 14, margin: "2px 0" }}>納期が近いタスクがあります</div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>3件のタスクの納期が近づいています（最短: 名刺デザイン一式・あと2日）</div>
        </div>
      </div>
    </Figure>
  );
}

export function FigInstall({ platform }: { platform: "ios" | "android" }) {
  return (
    <Figure caption={platform === "ios"
      ? "iPhoneではSafariの共有ボタンから「ホーム画面に追加」します。通知もこの状態でだけ届きます。"
      : "Androidでは、数回使うと表示される案内の「追加する」から追加できます。"}>
      <div className="panel" style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start", maxWidth: 460, margin: "0 auto" }}>
        <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", flexShrink: 0, background: "var(--surface-inverse)", color: "var(--fg-on-inverse)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="download" size={18} />
        </div>
        <div className="grow">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>ホーム画面に追加しませんか？</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.7 }}>
            {platform === "ios"
              ? "Safari下部の共有ボタンから「ホーム画面に追加」を選ぶと、アプリのように使えます。プッシュ通知もこの状態でのみ届きます。"
              : "アプリのように使えて、納期通知も受け取りやすくなります。"}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            {platform === "android" && <span className="btn btn-primary btn-sm">追加する</span>}
            <span className="btn btn-secondary btn-sm">あとで</span>
          </div>
        </div>
      </div>
    </Figure>
  );
}

// ---- オフライン ----
export function FigOffline() {
  return (
    <Figure caption="電波がないと上のバナーが出ます。変更は端末に保存され、オンラインに戻ると自動で同期されます。">
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: 13, lineHeight: 1.6, background: "var(--warn-soft)", color: "var(--warn)" }}>
          <strong style={{ display: "block" }}>オフライン — 端末内のデータを表示中</strong>
          タスクの追加・変更・削除はこの端末に保存され、接続回復後に同期されます。
          <span style={{ display: "block", fontWeight: 600 }}>同期前の変更: 2件（この端末に保存済み）</span>
        </div>
        <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: 13, background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600 }}>
          <span>同期前の変更: 2件（この端末に保存済み）</span>
          <span className="btn btn-secondary btn-sm">今すぐ同期</span>
        </div>
      </div>
    </Figure>
  );
}

// ---- 共有ページ ----
export function FigSharePage() {
  const metrics: [string, string][] = [["依頼受付", "受付中"], ["現在対応中", "2件"], ["受付可能", "3件"], ["累計完了", "28件"]];
  return (
    <Figure caption="共有ページの見本。公開する項目だけが表示され、タスク名・依頼先・金額は出ません。">
      <div className="share-page-content" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="text-meta" style={{ fontWeight: 600, marginBottom: 10 }}>ツクリスト | 共有ページ</div>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>デモクリエイター</div>
        <p style={{ color: "var(--fg-2)", fontSize: 13, lineHeight: 1.7, margin: "0 0 16px" }}>イラスト・デザインのご依頼を受付中です。</p>
        <div className="share-page-metrics">
          {metrics.map(([l, v]) => (
            <div key={l} style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--surface-2)" }}>
              <div className="text-meta" style={{ marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
          {["キャラクター", "バナー", "アイコン"].map(c => (
            <div key={c}>
              <div style={{ aspectRatio: "1", borderRadius: "var(--radius-md)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--meta)" }}><Icon name="image" size={20} /></div>
              <div className="text-meta" style={{ marginTop: 4 }}>{c}</div>
            </div>
          ))}
        </div>
      </div>
    </Figure>
  );
}

// ---- プラン・課金 ----
export function FigPlans() {
  const plans: [string, string, string[], boolean][] = [
    ["無料", "0円", ["画像 合計10枚", "納期アラート"], false],
    ["スタンダード", "300円/月", ["カレンダー表示", "画像 合計50枚"], false],
    ["プレミアム", "800円/月", ["共有ページ", "画像 無制限", "優先サポート"], true],
  ];
  return (
    <Figure caption="上位プランは下位プランの機能をすべて含みます（税込）。">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        {plans.map(([label, price, feats, f]) => (
          <div key={label} className={cx("pricing-card", f && "featured")} style={{ padding: 14 }}>
            <div className="text-meta" style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{price}</div>
            <ul style={{ listStyle: "none", display: "grid", gap: 6 }}>
              {feats.map(x => (
                <li key={x} style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--fg-2)" }}>
                  <span style={{ color: "var(--accent)", display: "inline-flex" }}><Icon name="check" size={14} /></span>{x}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Figure>
  );
}

export function FigCancel() {
  return (
    <Figure caption="解約は「予約」です。契約期間が終わるまでは、今のプランをそのまま使えます。">
      <div style={{ display: "flex", borderRadius: "var(--radius-md)", overflow: "hidden", fontSize: 12, fontWeight: 600 }}>
        <div style={{ flex: 3, padding: "14px 12px", background: "var(--accent-soft)", color: "var(--accent)", textAlign: "center" }}>有料プランのまま利用できる</div>
        <div style={{ flex: 1.4, padding: "14px 12px", background: "var(--surface-2)", color: "var(--fg-2)", textAlign: "center" }}>無料プランへ</div>
      </div>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
        <span>解約を予約</span><span>契約期間の終了日</span><span />
      </div>
    </Figure>
  );
}

export function FigPaymentAlert() {
  return (
    <Figure caption="支払いに失敗すると、一覧の上にこの警告が出ます。更新するまで再試行の間は有料プランのままです。">
      <div className="row" style={{ gap: 12, padding: "12px 16px", borderRadius: "var(--radius-md)", justifyContent: "space-between", flexWrap: "wrap", background: "var(--warn-soft)", color: "var(--warn)", fontSize: 13 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="alert" size={16} />有料プランのお支払いを確認できませんでした。支払い方法を更新してください。
        </span>
        <span className="btn btn-primary btn-sm">支払い方法を更新</span>
      </div>
    </Figure>
  );
}
