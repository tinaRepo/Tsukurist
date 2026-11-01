// デザイン方針（README「10. デザイン方針」）に反する箇所の修正。
//   node scripts/fix-design-tokens.mjs --dry-run
//   node scripts/fix-design-tokens.mjs --apply
//   1. 記号文字（▾ ↑ ↓）を <Icon> に置き換え（TagMultiSelect / TaskSearchBar / GuideFigures）
//   2. 存在しないトークン var(--primary) / var(--primary-soft) を --accent / --accent-soft に（ShareSettingsModal）
//   3. fontWeight: 700 を 600 に（共有ページ / DemoAppの共有サンプル / ガイドの図）
// 置換前の文字列がちょうど1回見つからないファイルは書き込まず報告する。適用済みなら黙ってスキップ（再実行可）。
// CRLF/LFはファイルごとに判定し、元の改行を維持する。適用後はこのスクリプトを削除してよい。
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
if (!["--dry-run", "--apply"].includes(mode)) { console.error("Usage: node scripts/fix-design-tokens.mjs --dry-run | --apply"); process.exit(2); }
const DRY = mode === "--dry-run";
const problems = [], changed = [];

function edit(file, pairs) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) { problems.push(`${file}: ファイルが見つかりません`); return; }
  const raw = fs.readFileSync(p, "utf8");
  const crlf = raw.includes("\r\n");
  const orig = crlf ? raw.replace(/\r\n/g, "\n") : raw;
  let t = orig, bad = 0;
  for (const [from, to] of pairs) {
    if (t.includes(to)) continue; // 適用済み
    const n = t.split(from).length - 1;
    if (n !== 1) { bad++; problems.push(`${file}: 「${from.slice(0, 40).replace(/\n/g, "⏎")}…」が${n}回見つかりました（期待: 1回）`); continue; }
    t = t.replace(from, () => to);
  }
  if (bad) { problems.push(`${file}: 問題があったため書き込みません`); return; }
  if (t !== orig) { if (!DRY) fs.writeFileSync(p, crlf ? t.replace(/\n/g, "\r\n") : t); changed.push(file); }
}

// 1) 記号文字 → Icon
edit("components/TagMultiSelect.tsx", [
  ['"use client";\n\ntype TagOption', '"use client";\n\nimport { Icon } from "./TaskShared";\n\ntype TagOption'],
  ['<span aria-hidden="true" style={{ flexShrink: 0, marginLeft: 8 }}>▾</span>',
   '<span aria-hidden="true" style={{ flexShrink: 0, marginLeft: 8, display: "inline-flex" }}><Icon name="chevronDown" size={14} /></span>'],
]);

edit("components/TaskSearchBar.tsx", [
  ['{sortDir === "asc" ? "↑ 昇順" : "↓ 降順"}',
   '<Icon name={sortDir === "asc" ? "chevronUp" : "chevronDown"} size={14} />\n            {sortDir === "asc" ? "昇順" : "降順"}'],
]);

edit("components/GuideFigures.tsx", [
  ['<span className="btn btn-secondary btn-sm">↑ 昇順</span>',
   '<span className="btn btn-secondary btn-sm"><Icon name="chevronUp" size={14} /> 昇順</span>'],
  ["<div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div>",
   "<div style={{ fontSize: 18, fontWeight: 600 }}>{v}</div>"],
]);

// 2) 存在しないトークン
edit("components/ShareSettingsModal.tsx", [
  ['"1px solid var(--primary)"', '"1px solid var(--accent)"'],
  ['"var(--primary-soft)"', '"var(--accent-soft)"'],
]);

// 3) fontWeight 700 → 600
edit("app/share/[token]/page.tsx", [
  ["<div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>", "<div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>"],
]);
edit("components/DemoApp.tsx", [
  ["<div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>", "<div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>"],
]);

console.log(DRY ? "[dry-run] 変更される（された）ファイル:" : "変更したファイル:");
changed.forEach(f => console.log("  M", f));
if (changed.length === 0 && problems.length === 0) console.log("  （なし。すでに適用済みです）");

// 参考: 残っている方針違反の候補を一覧表示する（修正はしない）
const SCAN = [
  [/var\(--(?!accent|bg|surface|fg|muted|meta|border|divider|danger|success|warn|info|neutral|on-accent|radius|shadow|ring|duration|ease|font|container|gutter|section|muted-on|fg-on|surface-)[a-z-]+\)/g, "globals.cssに無いトークンの疑い"],
  [/fontWeight:\s*(700|500|900)\b/g, "fontWeight 400/600以外"],
  [/[▾▴↑↓]/g, "記号文字（Iconへ）"],
];
const hits = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) walk(rel);
    else if (/\.tsx$/.test(e.name)) {
      fs.readFileSync(rel, "utf8").split(/\r?\n/).forEach((line, i) => {
        for (const [re, label] of SCAN) if (new RegExp(re.source).test(line)) hits.push(`  ${rel.replace(/\\/g, "/")}:${i + 1}  [${label}]`);
      });
    }
  }
})("app");
["components"].forEach(function w(dir) {
  (function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = path.join(d, e.name);
      if (e.isDirectory()) walk(rel);
      else if (/\.tsx$/.test(e.name)) {
        fs.readFileSync(rel, "utf8").split(/\r?\n/).forEach((line, i) => {
          for (const [re, label] of SCAN) if (new RegExp(re.source).test(line)) hits.push(`  ${rel.replace(/\\/g, "/")}:${i + 1}  [${label}]`);
        });
      }
    }
  })(dir);
});
console.log(hits.length ? `\n参考: 方針違反の候補（今回の対象外。必要なら確認）:\n${hits.join("\n")}` : "\n参考: 方針違反の候補は見つかりませんでした。");

if (problems.length) { console.error("\n要確認（該当ファイルは書き込んでいません）:"); problems.forEach(p => console.error("  !", p)); process.exitCode = 1; }
else console.log(DRY ? "\n問題なし。--apply で実行してください。" : "\n完了。git diff で確認してください。");
