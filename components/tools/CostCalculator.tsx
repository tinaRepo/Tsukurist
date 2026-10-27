"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GuestOnly } from "@/components/GuideAuth";
import { Field, Icon } from "@/components/TaskShared";

type Row = { id: number; name: string; price: string; qty: string };

const yen = (n: number) => `${n.toLocaleString("ja-JP")} 円`;
const num = (v: string) => Math.max(0, Number(v.replace(/,/g, "")) || 0);

// 報酬・料金に対する源泉徴収税額（100万円以下は10.21%、超える部分は20.42%）
function withholdingTax(amount: number) {
  if (amount <= 1_000_000) return Math.floor(amount * 0.1021);
  return Math.floor(1_000_000 * 0.1021 + (amount - 1_000_000) * 0.2042);
}

export default function CostCalculator() {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, name: "デザイン制作", price: "30000", qty: "1" },
    { id: 2, name: "修正対応（追加）", price: "5000", qty: "2" },
  ]);
  const [rushPct, setRushPct] = useState("0");
  const [taxRate, setTaxRate] = useState("10");
  const [withholding, setWithholding] = useState(false);
  const [hours, setHours] = useState("");

  const r = useMemo(() => {
    const subtotal = rows.reduce((s, x) => s + num(x.price) * num(x.qty), 0);
    const rush = Math.floor(subtotal * Math.min(500, num(rushPct)) / 100);
    const base = subtotal + rush;
    const tax = Math.floor(base * Number(taxRate) / 100);
    const wh = withholding ? withholdingTax(base) : 0;
    const total = base + tax - wh;
    const h = num(hours);
    return { subtotal, rush, base, tax, wh, total, hourly: h > 0 ? Math.round(base / h) : null };
  }, [rows, rushPct, taxRate, withholding, hours]);

  const update = (id: number, patch: Partial<Row>) => setRows(s => s.map(x => (x.id === id ? { ...x, ...patch } : x)));

  const line = (label: string, value: string, strong = false) => (
    <div className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--divider)", fontWeight: strong ? 600 : 400, fontSize: strong ? 16 : 14 }}>
      <span>{label}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ padding: 18, display: "grid", gap: 16 }}>
        <div>
          <div className="field-label">項目（金額は税抜で入力）</div>
          <div style={{ display: "grid", gap: 8 }}>
            {rows.map((x, i) => (
              <div key={x.id} className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <input className="input" placeholder="項目名" value={x.name} onChange={e => update(x.id, { name: e.target.value })} style={{ flex: "2 1 140px", minWidth: 0 }} />
                <input className="input" inputMode="numeric" placeholder="単価" aria-label={`${x.name || `項目${i + 1}`}の単価`} value={x.price}
                  onChange={e => update(x.id, { price: e.target.value.replace(/[^0-9]/g, "") })} style={{ flex: "1 1 90px", minWidth: 0 }} />
                <span className="text-meta">×</span>
                <input className="input" inputMode="numeric" aria-label={`${x.name || `項目${i + 1}`}の数量`} value={x.qty}
                  onChange={e => update(x.id, { qty: e.target.value.replace(/[^0-9]/g, "") })} style={{ width: 64, textAlign: "center" }} />
                <button type="button" className="icon-btn" aria-label="この項目を削除" disabled={rows.length <= 1}
                  onClick={() => setRows(s => s.filter(y => y.id !== x.id))}
                  style={{ background: "var(--surface-2)", color: "var(--fg)", width: 32, height: 32, flexShrink: 0 }}>
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} disabled={rows.length >= 15}
            onClick={() => setRows(s => [...s, { id: Date.now(), name: "", price: "", qty: "1" }])}>
            <Icon name="plus" size={14} /> 項目を追加
          </button>
        </div>

        <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 120px" }}>
            <Field label="特急料金（％加算）">
              <input className="input" inputMode="numeric" value={rushPct} onChange={e => setRushPct(e.target.value.replace(/[^0-9]/g, ""))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <Field label="消費税">
              <select className="select" value={taxRate} onChange={e => setTaxRate(e.target.value)}>
                <option value="10">10％</option><option value="8">8％</option><option value="0">なし（免税など）</option>
              </select>
            </Field>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <Field label="作業時間（任意・時間）">
              <input className="input" inputMode="numeric" placeholder="例: 20" value={hours} onChange={e => setHours(e.target.value.replace(/[^0-9]/g, ""))} />
            </Field>
          </div>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={withholding} onChange={e => setWithholding(e.target.checked)} style={{ width: 16, height: 16 }} />
          源泉徴収を差し引く（個人への報酬で対象になる場合）
        </label>
      </div>

      <div className="card" style={{ padding: 18 }} aria-live="polite">
        {line("小計（税抜）", yen(r.subtotal))}
        {r.rush > 0 && line(`特急料金（${num(rushPct)}％）`, yen(r.rush))}
        {line("消費税", yen(r.tax))}
        {withholding && line("源泉徴収税額（差し引き）", `− ${yen(r.wh)}`)}
        {line("お支払い総額", yen(r.total), true)}
        {r.hourly !== null && <div className="text-meta" style={{ marginTop: 10 }}>時給換算（税抜 ÷ 作業時間）: 約 {yen(r.hourly)}</div>}
        <GuestOnly>
          <p style={{ marginTop: 14, fontSize: 13 }}>
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>この金額を依頼ごとに記録して、合計を一覧で確認する</Link>
          </p>
        </GuestOnly>
      </div>
    </div>
  );
}
