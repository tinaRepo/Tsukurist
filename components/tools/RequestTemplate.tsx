"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Field } from "@/components/TaskShared";

type Form = {
  title: string; assignee: string; purpose: string; scope: string; format: string;
  draftDate: string; deadline: string; price: string; revisions: string; payment: string;
  usage: string; credit: boolean; notes: string;
};

const INITIAL: Form = {
  title: "", assignee: "", purpose: "", scope: "", format: "", draftDate: "", deadline: "",
  price: "", revisions: "2", payment: "納品・検収の完了後", usage: "商用利用可（自社の販促・広告・SNSなど）", credit: false, notes: "",
};

const PAYMENTS = ["納品・検収の完了後", "着手前に全額", "着手前に半額、納品後に残額", "月末締め・翌月末払い"];
const USAGES = ["商用利用可（自社の販促・広告・SNSなど）", "個人利用のみ（商用利用は不可）", "SNS・自社サイトでの公開のみ可", "利用範囲は別途相談"];

const fmtDate = (d: string) => {
  if (!d) return "未定";
  const [y, m, day] = d.split("-");
  return `${y}年${Number(m)}月${Number(day)}日`;
};
const orTbd = (v: string) => v.trim() || "未定";

function buildText(f: Form) {
  const price = f.price ? `${Number(f.price).toLocaleString("ja-JP")}円（税別・税込は要確認）` : "未定";
  return [
    `【制作依頼書】${orTbd(f.title)}`,
    "",
    `${f.assignee.trim() || "（依頼先）"} 様`,
    "",
    "このたびは制作のご相談をありがとうございます。以下の内容でお願いしたく、ご確認をお願いします。",
    "",
    "■ 依頼の目的・背景",
    orTbd(f.purpose),
    "",
    "■ 依頼内容・仕様",
    orTbd(f.scope),
    "",
    "■ 納品形式",
    orTbd(f.format),
    "",
    "■ スケジュール",
    `・途中確認（下書き・ラフなど）: ${fmtDate(f.draftDate)}`,
    `・納期: ${fmtDate(f.deadline)}`,
    "",
    "■ 報酬",
    price,
    "",
    "■ 修正対応",
    `${f.revisions || "0"}回まで（超える場合は、内容に応じて別途ご相談）`,
    "",
    "■ 支払い時期",
    f.payment,
    "",
    "■ 利用範囲",
    f.usage,
    `クレジット表記: ${f.credit ? "必要" : "不要"}`,
    "",
    "■ その他・補足",
    orTbd(f.notes),
    "",
    "ご不明な点や、対応が難しい点があれば、お気軽にご連絡ください。どうぞよろしくお願いいたします。",
  ].join("\n");
}

export default function RequestTemplate() {
  const [f, setF] = useState<Form>(INITIAL);
  const [status, setStatus] = useState("");
  const text = useMemo(() => buildText(f), [f]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF(s => ({ ...s, [k]: v }));

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("コピーしました");
    } catch {
      setStatus("コピーできませんでした。下の文面を選択してコピーしてください。");
    }
    setTimeout(() => setStatus(""), 3000);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `依頼書_${f.title.trim() || "テンプレート"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ padding: 18, display: "grid", gap: 14 }}>
        <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 200px" }}><Field label="件名"><input className="input" placeholder="例: 名刺デザイン一式" value={f.title} onChange={e => set("title", e.target.value)} /></Field></div>
          <div style={{ flex: "1 1 200px" }}><Field label="依頼先の名前"><input className="input" placeholder="例: 田中デザイン事務所" value={f.assignee} onChange={e => set("assignee", e.target.value)} /></Field></div>
        </div>
        <Field label="依頼の目的・背景"><textarea className="textarea" style={{ minHeight: 64 }} placeholder="例: 新店舗オープンに向けて、配布用の名刺を新しくしたい" value={f.purpose} onChange={e => set("purpose", e.target.value)} /></Field>
        <Field label="依頼内容・仕様（サイズ・枚数・雰囲気など）"><textarea className="textarea" style={{ minHeight: 90 }} placeholder="例: 表裏2面、91×55mm、シンプルで落ち着いた雰囲気。ロゴは支給します" value={f.scope} onChange={e => set("scope", e.target.value)} /></Field>
        <Field label="納品形式"><input className="input" placeholder="例: 入稿用PDFとPNG" value={f.format} onChange={e => set("format", e.target.value)} /></Field>
        <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 150px" }}><Field label="途中確認の日"><input type="date" className="input input-date" value={f.draftDate} onChange={e => set("draftDate", e.target.value)} /></Field></div>
          <div style={{ flex: "1 1 150px" }}><Field label="納期"><input type="date" className="input input-date" value={f.deadline} onChange={e => set("deadline", e.target.value)} /></Field></div>
          <div style={{ flex: "1 1 120px" }}><Field label="報酬（円）"><input className="input" inputMode="numeric" value={f.price} onChange={e => set("price", e.target.value.replace(/[^0-9]/g, ""))} /></Field></div>
          <div style={{ flex: "1 1 100px" }}><Field label="修正の回数"><input className="input" inputMode="numeric" value={f.revisions} onChange={e => set("revisions", e.target.value.replace(/[^0-9]/g, ""))} /></Field></div>
        </div>
        <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 220px" }}>
            <Field label="支払い時期"><select className="select" value={f.payment} onChange={e => set("payment", e.target.value)}>{PAYMENTS.map(p => <option key={p}>{p}</option>)}</select></Field>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <Field label="利用範囲"><select className="select" value={f.usage} onChange={e => set("usage", e.target.value)}>{USAGES.map(p => <option key={p}>{p}</option>)}</select></Field>
          </div>
        </div>
        <label className="checkbox-row"><input type="checkbox" checked={f.credit} onChange={e => set("credit", e.target.checked)} style={{ width: 16, height: 16 }} />クレジット表記を求める</label>
        <Field label="その他・補足"><textarea className="textarea" style={{ minHeight: 64 }} placeholder="例: 参考資料は別途メールで送ります" value={f.notes} onChange={e => set("notes", e.target.value)} /></Field>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>依頼書の文面</div>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>コピー</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={download}>テキストで保存</button>
          </div>
        </div>
        <div role="status" className="text-meta" style={{ minHeight: 18, marginBottom: 6, color: "var(--success)" }}>{status}</div>
        <textarea className="textarea" readOnly value={text} aria-label="作成された依頼書の文面" style={{ minHeight: 360, fontSize: 14 }} />
        <p style={{ marginTop: 12, fontSize: 13 }}>
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>依頼した内容と納期を、ツクリストで管理する</Link>
        </p>
      </div>
    </div>
  );
}
