// 通知時刻（ユーザーごと・毎時Cron）対応のための既存ファイル部分修正。
//   node scripts/apply-notify-hour.mjs --dry-run
//   node scripts/apply-notify-hour.mjs --apply
// 置換前の文字列がちょうど1回見つからないファイルは書き込まず報告する。適用済みなら黙ってスキップ（再実行可）。
// 実行前にコミットしておき、適用後は git diff で確認すること。適用後はこのスクリプトを削除してよい。
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
if (!["--dry-run", "--apply"].includes(mode)) { console.error("Usage: node scripts/apply-notify-hour.mjs --dry-run | --apply"); process.exit(2); }
const DRY = mode === "--dry-run";
const problems = [], changed = [];

function edit(file, pairs) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) { problems.push(`${file}: ファイルが見つかりません`); return; }
  const orig = fs.readFileSync(p, "utf8");
  let t = orig, bad = 0;
  for (const [from, to, all] of pairs) {
    if (t.includes(to)) continue;
    const n = t.split(from).length - 1;
    if (n === 0 || (n > 1 && !all)) { bad++; problems.push(`${file}: 「${from.slice(0, 40)}…」が${n}回見つかりました`); continue; }
    t = t.split(from).join(to);
  }
  if (bad) return;
  if (t !== orig) { if (!DRY) fs.writeFileSync(p, t); changed.push(file); }
}

edit("components/TaskApp.tsx", [
  ['import PushNotificationToggle from "./PushNotificationToggle";',
    'import PushNotificationToggle from "./PushNotificationToggle";\nimport NotifyHourSelect from "./NotifyHourSelect";'],
  ['<PushNotificationToggle enabled={isOnline} />',
    '<PushNotificationToggle enabled={isOnline} />\n                <NotifyHourSelect userId={user?.id ?? null} enabled={isOnline} />'],
]);

edit("cloudflare/cron-worker/index.mjs", [
  ['// 毎日 23:00 UTC（= 日本時間 8:00）に、/api/cron/deadline-notify を',
    '// 毎時0分に、/api/cron/deadline-notify を'],
  ['// Authorization: Bearer <CRON_SECRET> 付きで GET する。処理本体は',
    '// Authorization: Bearer <CRON_SECRET> 付きで GET する。ユーザーごとの通知時刻（JST）に一致する人への送信判定も含め、処理本体は'],
]);

edit(".env.example", [
  ['毎日8時（日本時間）のCronが成功するたびにpingし', '毎時のCronが成功するたびにpingし'],
]);

edit("README.md", [
  ['（**毎日 8:00・日本時間**）が、`/api/cron/deadline-notify` を呼び出して実行します。',
    '（**毎時0分**）が、`/api/cron/deadline-notify` を呼び出して実行します。ルート側で、ユーザーが設定した通知時刻（日本時間・既定8時。ユーザーメニューの「通知時刻」で0〜23時から選択）に一致するユーザーにだけ送信します。'],
  ['同じ実行で、期限切れの記録', '日本時間4時台の実行（1日1回）で、期限切れの記録'],
  ['Cloudflareの Cron 式はUTC基準で、`0 23 * * *` が毎日8:00（日本時間）に相当します。Healthchecks.ioもCron式 `0 23 * * *`、タイムゾーン `UTC`、Grace Time `15 minutes` に設定してください。',
    'Cloudflareの Cron 式は `0 * * * *`（毎時0分）です。Healthchecks.ioもCron式 `0 * * * *`、タイムゾーン `UTC`、Grace Time `15 minutes` に設定してください。`/api/health?deep=1` は最終成功が120分以内かを確認します。'],
  ['- ✅ 毎朝8時（日本時間）のプッシュ通知（納期 7 日以内。',
    '- ✅ プッシュ通知（既定は毎朝8時・日本時間。ユーザーメニューの「通知時刻」で0〜23時に変更可。納期 7 日以内。'],
]);

edit("docs/cloudflare-cron.md", [
  ['納期通知のCron（毎日 日本時間8:00）は', '納期通知のCron（毎時0分に起動し、各ユーザーの通知時刻（既定 日本時間8:00）のユーザーにだけ送信）は'],
  ['─ Cron 23:00 UTC ─▶', '─ Cron 毎時0分 ─▶', true],
  ['| スケジュール | `0 23 * * *`（日本時間8:00） | 同じ。止めたい期間は `crons = []` |',
    '| スケジュール | `0 * * * *`（毎時0分） | 同じ。止めたい期間は `crons = []` |'],
  ['Cron式 `0 23 * * *`、タイムゾーン `UTC`、Grace Time `15 minutes`', 'Cron式 `0 * * * *`、タイムゾーン `UTC`、Grace Time `15 minutes`'],
  ['Cron `0 23 * * *` が表示される', 'Cron `0 * * * *` が表示される'],
  ['スケジュールを `0 23 * * *` に戻して', 'スケジュールを `0 * * * *` に戻して'],
  ['最後の成功が約26時間以内か', '最後の成功が約2時間以内か'],
  ['将来、`user_settings.notify_hour`（ユーザーごとの通知時刻）に対応して毎時実行にする場合も、`wrangler.toml` の `crons` を `0 * * * *` に変更し、ルート側を時刻対応にするだけで済みます。',
    'ユーザーごとの通知時刻（`user_settings.notify_hour`・日本時間）に対応するため、毎時実行にしています。ルート側が「現在のJST時 = notify_hour」のユーザーだけを対象にし、`user_settings` が無いユーザーは8時として扱います。通知時刻を変えても、`notification_log` により同じ日の通知は1回までです。古い記録・ログの削除は、日本時間4時台の実行でのみ行います。Cloudflareの無料プランでも、Cron Triggerは1本のままで足ります。'],
]);

edit("lib/guide-pages.tsx", [
  ['毎朝8時（日本時間）のプッシュ通知の設定と止め方', 'プッシュ通知の設定・通知時刻の変更と止め方'],
  ['<strong>毎朝8時（日本時間）</strong>に、プッシュ通知でお知らせします。',
    '<strong>毎朝8時（日本時間・初期設定）</strong>に、プッシュ通知でお知らせします。時刻は変更できます。'],
  ['通知は端末ごとにオン・オフできます。スマホとパソコンの両方',
    '通知の時刻は、ユーザーメニューの<strong>「通知時刻（日本時間）」</strong>から0〜23時で選べます（アカウント共通の設定です）。1日に届く通知は1回までです。通知は端末ごとにオン・オフできます。スマホとパソコンの両方'],
]);

console.log(DRY ? "[dry-run] 変更される（された）ファイル:" : "変更したファイル:");
changed.forEach(f => console.log("  M", f));
if (problems.length) { console.error("\n要確認（該当ファイルは書き込んでいません）:"); problems.forEach(p => console.error("  !", p)); process.exitCode = 1; }
else console.log(DRY ? "\n問題なし。--apply で実行してください。" : "\n完了。git diff で確認してください。");
