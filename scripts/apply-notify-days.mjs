// 納期通知の粒度設定（notify_days）・タスク個別リマインド（remind_before_days）対応の部分修正。
//   node scripts/apply-notify-days.mjs --dry-run
//   node scripts/apply-notify-days.mjs --apply
// 置換前の文字列がちょうど1回見つからないファイルは書き込まず報告する。適用済みなら黙ってスキップ（再実行可）。
// 実行前にコミットしておき、適用後は git diff で確認すること。適用後はこのスクリプトを削除してよい。
// 前提: lib/notify.ts / components/NotifyHourSelect.tsx / マイグレーションは zip の内容で上書き・追加済みであること。
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
if (!["--dry-run", "--apply"].includes(mode)) { console.error("Usage: node scripts/apply-notify-days.mjs --dry-run | --apply"); process.exit(2); }
const DRY = mode === "--dry-run";
const problems = [], changed = [];

function edit(file, pairs) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) { problems.push(`${file}: ファイルが見つかりません`); return; }
  const raw = fs.readFileSync(p, "utf8");
  const crlf = raw.includes("\r\n");               // Windowsの改行（CRLF）なら、LFで処理して最後に戻す
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

// ---- 型 ----
edit("lib/supabase.ts", [
  ["  notes?: string;\n  created_at: string;\n  updated_at: string;\n  images?: TaskImage[];",
   "  notes?: string;\n  remind_before_days?: number | null; // タスク個別リマインド（納期の何日前に通知するか。null/未設定=なし）\n  created_at: string;\n  updated_at: string;\n  images?: TaskImage[];"],
  ["  submission_date: string | null;\n  notes: string | null;\n}",
   "  submission_date: string | null;\n  notes: string | null;\n  remind_before_days: number | null;\n}"],
]);

edit("lib/offline-tasks.ts", [
  ["      notes: values.notes ?? undefined,\n",
   "      notes: values.notes ?? undefined,\n      remind_before_days: values.remind_before_days,\n"],
]);

// ---- Cron ----
edit("app/api/cron/deadline-notify/route.ts", [
  ['import { getLogger, withRequestLog } from "@/lib/server/logger";',
   'import { getLogger, withRequestLog } from "@/lib/server/logger";\nimport { DEFAULT_NOTIFY_DAYS, NOTIFY_DAYS_MAX, normalizeNotifyDays, shouldNotify } from "@/lib/notify";'],
  ["const DAYS_AHEAD = 7;            // 納期までこの日数以内のタスクを通知",
   "const DAYS_AHEAD = NOTIFY_DAYS_MAX; // 取得する納期の範囲（個別リマインドの最大値に合わせる）。通知するかはユーザー設定で判定"],
  ["type TaskRow = { user_id: string; title: string; deadline: string };",
   "type TaskRow = { user_id: string; title: string; deadline: string; remind_before_days: number | null };\ntype MatchedTask = TaskRow & { left: number };"],
  ["// 対象タスクがある通知購読ユーザーの全端末へWeb Pushを送る。",
   "// 「通知する日（notify_days）」またはタスク個別リマインド（remind_before_days）に当たるタスクがある通知購読ユーザーの全端末へWeb Pushを送る。"],
  ["fetchAll<{ user_id: string; notify_hour: number }>(range =>\n      admin.from(\"user_settings\").select(\"user_id, notify_hour\")",
   "fetchAll<{ user_id: string; notify_hour: number; notify_days: number[] }>(range =>\n      admin.from(\"user_settings\").select(\"user_id, notify_hour, notify_days\")"],
  ["    const hourByUser = new Map(settings.map(s => [s.user_id, s.notify_hour]));\n",
   "    const hourByUser = new Map(settings.map(s => [s.user_id, s.notify_hour]));\n    const daysByUser = new Map(settings.map(s => [s.user_id, normalizeNotifyDays(s.notify_days)]));\n"],
  ['.select("user_id, title, deadline")\n',
   '.select("user_id, title, deadline, remind_before_days")\n'],
  ["    const byUser = new Map<string, TaskRow[]>();\n    for (const t of tasks) {\n      if (!targets.has(t.user_id)) continue;\n      byUser.set(t.user_id, [...(byUser.get(t.user_id) ?? []), t]);\n    }",
   "    // 全体の「通知する日」またはタスク個別リマインドに当たるものだけを残す\n    const todayMs = Date.parse(today);\n    const byUser = new Map<string, MatchedTask[]>();\n    for (const t of tasks) {\n      if (!targets.has(t.user_id)) continue;\n      const left = Math.round((Date.parse(t.deadline) - todayMs) / 86400_000);\n      if (!shouldNotify(left, daysByUser.get(t.user_id) ?? DEFAULT_NOTIFY_DAYS, t.remind_before_days)) continue;\n      const list = byUser.get(t.user_id);\n      if (list) list.push({ ...t, left });\n      else byUser.set(t.user_id, [{ ...t, left }]);\n    }"],
  ["      const days = Math.round((Date.parse(list[0].deadline) - Date.parse(today)) / 86400_000);\n      const when = days === 0 ? \"本日\" : `あと${days}日`;",
   "      const when = list[0].left === 0 ? \"本日\" : `あと${list[0].left}日`;"],
  ["body: `${list.length}件が${DAYS_AHEAD}日以内に納期です（最短: ${list[0].title}・${when}）`,",
   "body: `${list.length}件のタスクの納期が近づいています（最短: ${list[0].title}・${when}）`,"],
]);

// ---- TaskApp ----
edit("components/TaskApp.tsx", [
  ['import NotifyHourSelect from "./NotifyHourSelect";',
   'import NotifyHourSelect from "./NotifyHourSelect";\nimport { TASK_REMIND_OPTIONS, formatDaysBefore } from "@/lib/notify";'],
  ["  status: TaskStatus; submission_date: string; notes: string;\n  tagIds: string[];\n};",
   "  status: TaskStatus; submission_date: string; notes: string;\n  tagIds: string[];\n  remindBefore: string; // \"\" = なし / \"0\"〜\"30\"\n};"],
  ["submission_date: \"\", notes: \"\",\n  tagIds: [],\n};",
   "submission_date: \"\", notes: \"\",\n  tagIds: [], remindBefore: \"\",\n};"],
  ["      tagIds: t.tag_ids ?? [],\n    });",
   "      tagIds: t.tag_ids ?? [],\n      remindBefore: t.remind_before_days == null ? \"\" : String(t.remind_before_days),\n    });"],
  ["status: form.status, submission_date: form.submission_date || null, notes: form.notes || null,\n    };",
   "status: form.status, submission_date: form.submission_date || null, notes: form.notes || null,\n      remind_before_days: form.remindBefore === \"\" ? null : Number(form.remindBefore),\n    };"],
  ['                <DateField label="納期" value={form.deadline} onChange={v => setForm({ ...form, deadline: v })} />\n',
   '                <DateField label="納期" value={form.deadline} onChange={v => setForm({ ...form, deadline: v })} />\n' +
   '                <Field label="リマインド（納期の何日前に通知）">\n' +
   '                  <select value={form.remindBefore} onChange={e => setForm({ ...form, remindBefore: e.target.value })} className="select">\n' +
   '                    <option value="">設定しない</option>\n' +
   '                    {TASK_REMIND_OPTIONS.map(n => <option key={n} value={n}>{formatDaysBefore(n)}</option>)}\n' +
   '                  </select>\n' +
   '                  <div className="text-meta" style={{ marginTop: 6, lineHeight: 1.6 }}>\n' +
   '                    {form.deadline\n' +
   '                      ? "このタスクだけの追加の通知です。通知をオンにした端末に、通知時刻に届きます。"\n' +
   '                      : "納期を設定すると有効になります。"}\n' +
   '                  </div>\n' +
   '                </Field>\n'],
  ['                    ["提出日", fmtDate(detailItem.submission_date)],\n',
   '                    ["提出日", fmtDate(detailItem.submission_date)],\n                    ["リマインド", detailItem.remind_before_days == null ? "—" : `納期の${formatDaysBefore(detailItem.remind_before_days)}`],\n'],
]);

// ---- ガイド ----
edit("lib/guide-pages.tsx", [
  ["<li><strong>金額（円）</strong>：数字だけを入力します。3桁ごとのカンマは自動で付きます。</li>",
   "<li><strong>リマインド</strong>：納期の何日前（当日〜30日前）にプッシュ通知するかを、このタスクだけ追加で設定できます。納期が未設定のときは働きません。</li>\n              <li><strong>金額（円）</strong>：数字だけを入力します。3桁ごとのカンマは自動で付きます。</li>"],
  ["プッシュ通知の設定・通知時刻の変更と止め方", "プッシュ通知の設定・通知する日と時刻の変更と止め方"],
  ["「3件が7日以内に納期です（最短：名刺デザイン一式・あと2日）」のような本文です",
   "「3件のタスクの納期が近づいています（最短：名刺デザイン一式・あと2日）」のような本文です"],
  ["から0〜23時で選べます（アカウント共通の設定です）。1日に届く通知は1回までです。",
   "から0〜23時で選べます。その下の<strong>「通知する日」</strong>で、納期の何日前に通知するかを選びます（当日・1〜7日前・14日前。初期設定はすべてオンで、従来どおり納期7日以内は毎日届きます）。すべて外すと、納期の自動通知は止まります。どちらもアカウント共通の設定です。特定のタスクだけ早めに知りたいときは、タスクの登録・編集フォームの<strong>「リマインド」</strong>で「納期の2日前」のように設定できます。「通知する日」とは別に追加で通知されます。1日に届く通知は1回までで、該当するタスクが複数あるときは1通にまとめて届きます。"],
  ["<li>7日以内に納期を迎える、完成・キャンセル以外のタスクがあるか。</li>",
   "<li>「通知する日」または個別リマインドに当たる、完成・キャンセル以外のタスクがあるか。</li>"],
]);

edit("components/GuideFigures.tsx", [
  ["毎朝8時（日本時間）に届く通知のイメージ。納期が7日以内のタスクがある日だけ届きます。",
   "設定した時刻（初期は毎朝8時・日本時間）に届く通知のイメージ。「通知する日」や個別リマインドに当たるタスクがある日だけ届きます。"],
  ["3件が7日以内に納期です（最短: 名刺デザイン一式・あと2日）",
   "3件のタスクの納期が近づいています（最短: 名刺デザイン一式・あと2日）"],
]);

// ---- README・docs ----
edit("README.md", [
  ["処理本体はVercel側のルートです。納期が7日以内の未完了タスクがあるユーザーのうち、",
   "処理本体はVercel側のルートです。ユーザーごとの「通知する日」（`user_settings.notify_days`。納期の何日前か。既定は当日〜7日前）またはタスク個別のリマインド（`tasks.remind_before_days`）に当たる未完了タスクがあるユーザーのうち、"],
  ["納期 7 日以内。同じ日の重複送信防止。",
   "「通知する日」で納期の何日前に通知するかを選択（当日・1〜7日前・14日前。既定は当日〜7日前）。同じ日の重複送信防止。"],
  ["- ✅ 検索結果の合計金額表示（チェックボックスで切替、既定は非表示）\n",
   "- ✅ 検索結果の合計金額表示（チェックボックスで切替、既定は非表示）\n- ✅ タスク個別のリマインド（納期の何日前に追加で通知するか。0〜30日前。全体の「通知する日」とは別に届く）\n"],
]);

edit("docs/development-guide.md", [
  ["- `lib/supabase.ts`: Supabaseクライアント、型、データ操作\n",
   "- `lib/supabase.ts`: Supabaseクライアント、型、データ操作\n- `lib/notify.ts`: 納期通知の定数・判定（通知する日／個別リマインド）。ブラウザとCronの両方から使うため副作用を持たせない。値の範囲はDBのcheck制約と同じ\n"],
]);

edit("docs/cloudflare-cron.md", [
  ["`user_settings` が無いユーザーは8時として扱います。",
   "`user_settings` が無いユーザーは8時として扱います。対象ユーザーのうち、各ユーザーの `notify_days`（既定は当日〜7日前）または各タスクの `remind_before_days` に当たるタスクがある場合にだけ送信します（納期は30日先までを取得し、判定はルート内で行います）。"],
]);

console.log(DRY ? "[dry-run] 変更される（された）ファイル:" : "変更したファイル:");
changed.forEach(f => console.log("  M", f));
if (problems.length) { console.error("\n要確認（該当ファイルは書き込んでいません）:"); problems.forEach(p => console.error("  !", p)); process.exitCode = 1; }
else console.log(DRY ? "\n問題なし。--apply で実行してください。" : "\n完了。git diff で確認してください。");
