// デザイン方針（README「10. デザイン方針」）に反する残りの箇所の修正。
//   node scripts/fix-symbols-gradient.mjs --dry-run
//   node scripts/fix-symbols-gradient.mjs --apply
//   1. 記号文字（→ ← ↗ ＋）を <Icon> に置き換え / 文面から削除
//        - TaskShared.tsx に外部リンク用の Icon "external" を追加
//   2. .demo-share-art のグラデーションをトークンの単色に置き換え（components.css）
// 置換前の文字列がちょうど1回見つからないファイルは書き込まず報告する。適用済みなら黙ってスキップ（再実行可）。
// CRLF/LFはファイルごとに判定し、元の改行を維持する。適用後はこのスクリプトを削除してよい。
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
if (!["--dry-run", "--apply"].includes(mode)) { console.error("Usage: node scripts/fix-symbols-gradient.mjs --dry-run | --apply"); process.exit(2); }
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

// 外部リンクのアイコン（24x24・線幅1.7前提。右上へ向かう矢印と四角）
edit("components/TaskShared.tsx", [
  ["} satisfies Record<string, string>;",
   '  external: "M14 4h6v6 M20 4l-9 9 M18 14v5H5V6h5",\n} satisfies Record<string, string>;'],
]);

// ランディングページ: CTAの「→」
edit("components/LandingPage.tsx", [
  ["無料で始める →</a>", ' 無料で始める<Icon name="chevronRight" size={16} /></a>'.trimStart()],
  ["無料アカウントを作成 →</a>", '無料アカウントを作成<Icon name="chevronRight" size={16} /></a>'],
]);

// ログイン: 「← ログインに戻る」。TextLinkはアイコンと文字を揃えるため inline-flex にする
edit("app/login/page.tsx", [
  ["← ログインに戻る", '<Icon name="arrowLeft" size={14} /> ログインに戻る'],
  ['fontWeight: 600, fontSize: 13, padding: "0 4px",',
   'fontWeight: 600, fontSize: 13, padding: "0 4px", display: "inline-flex", alignItems: "center", gap: 4,'],
]);

// 共有ページ・デモの共有サンプル: 「↗」
const SOCIAL_FROM = '<span className="share-page-social-host">{host} のプロフィールを見る ↗</span>';
const SOCIAL_TO = '<span className="share-page-social-host">{host} のプロフィールを見る</span>\n' +
  '                <span aria-hidden="true" style={{ display: "inline-flex", flexShrink: 0 }}><Icon name="external" size={14} /></span>';
edit("app/share/[token]/page.tsx", [
  ['import Image from "next/image";', 'import Image from "next/image";\nimport { Icon } from "@/components/TaskShared";'],
  [SOCIAL_FROM, SOCIAL_TO],
]);

edit("components/DemoApp.tsx", [
  [SOCIAL_FROM, SOCIAL_TO.replace("\n                <span", "\n                      <span")],
  ["「＋ 新規登録」から", "「新規登録」から"],
]);

// 共有ページのサンプル画像: グラデーション → トークンの単色
edit("app/components.css", [
  ["  font-weight: 600;\n  background: linear-gradient(145deg, #d7a6a3, #735f8d);\n}",
   "  font-weight: 600;\n  background: var(--surface-inverse);\n}"],
  [".demo-share-art-2 {\n  background: linear-gradient(145deg, #8fc4bd, #355b73);\n}",
   ".demo-share-art-2 {\n  background: var(--accent-fill);\n}"],
  [".demo-share-art-3 {\n  background: linear-gradient(145deg, #e8bd77, #b46f63);\n}",
   ".demo-share-art-3 {\n  background: var(--neutral);\n}"],
]);

console.log(DRY ? "[dry-run] 変更される（された）ファイル:" : "変更したファイル:");
changed.forEach(f => console.log("  M", f));
if (changed.length === 0 && problems.length === 0) console.log("  （なし。すでに適用済みです）");

// 参考: 残っている方針違反の候補を一覧表示する（修正はしない。コメント行は除く）
const SCAN = [
  [/linear-gradient|radial-gradient/, "グラデーション"],
  [/var\(--primary/, "存在しないトークン"],
  [/fontWeight:\s*(700|500|900)\b/, "fontWeight 400/600以外"],
  [/[▾▴↑↓→←↗＋]/, "記号文字（Iconへ）"],
];
const hits = [];
function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const rel = path.join(d, e.name);
    if (e.isDirectory()) { walk(rel); continue; }
    if (!/\.(tsx|css)$/.test(e.name)) continue;
    fs.readFileSync(rel, "utf8").split(/\r?\n/).forEach((line, i) => {
      const s = line.trim();
      if (s.startsWith("//") || s.startsWith("*") || s.startsWith("/*") || s.startsWith("{/*")) return;
      for (const [re, label] of SCAN) if (re.test(line)) hits.push(`  ${rel.replace(/\\/g, "/")}:${i + 1}  [${label}]`);
    });
  }
}
["app", "components"].forEach(walk);
console.log(hits.length ? `\n参考: 方針違反の候補（今回の対象外。本文の説明文などは問題ない場合があります）:\n${hits.join("\n")}` : "\n参考: 方針違反の候補は見つかりませんでした。");

if (problems.length) { console.error("\n要確認（該当ファイルは書き込んでいません）:"); problems.forEach(p => console.error("  !", p)); process.exitCode = 1; }
else console.log(DRY ? "\n問題なし。--apply で実行してください。" : "\n完了。git diff で確認してください。");
