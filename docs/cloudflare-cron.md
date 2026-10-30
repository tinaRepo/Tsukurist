# Cloudflare Cron 運用ガイド

納期通知のCron（毎時0分に起動し、各ユーザーの通知時刻（既定 日本時間8:00）のユーザーにだけ送信）は、Vercel Cronではなく **Cloudflare Workers の Cron Trigger** から起動します。Workerは `/api/cron/deadline-notify` を `Authorization: Bearer <CRON_SECRET>` 付きで呼ぶだけで、通知の送信・古い記録とログの削除・実行記録（`job_runs`）・監視通知は Vercel 側のルートが行います。

**本番(production)と検証(staging)は、別々のWorkerとしてデプロイします。** Vercelの Production / Preview の環境変数分離（Supabase・Stripe・`CRON_SECRET` など）に合わせた構成です。

```
[本番]  Worker: tsukurist-cron          ─ Cron 毎時0分 ─▶ https://tsukurist.com/api/cron/deadline-notify          (Vercel Production)
[検証]  Worker: tsukurist-cron-staging  ─ Cron 毎時0分 ─▶ https://<検証環境の安定したURL>/api/cron/deadline-notify  (Vercel Preview)
                          └─ どちらも Bearer <その環境の CRON_SECRET> で GET
                               └─ Vercel: 通知送信 / purge_app_logs / job_runs / Healthchecks.io ping（その環境のDB・設定を使用）
```

## 環境ごとの設定一覧

| 項目                              | 本番 (`--env production`)                        | 検証 (`--env staging`)                           |
| --------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Worker名                          | `tsukurist-cron`                                 | `tsukurist-cron-staging`                         |
| 呼び出し先 `TARGET_URL`           | `https://tsukurist.com/api/cron/deadline-notify` | 検証環境の安定したURL（要書き換え）              |
| スケジュール                      | `0 * * * *`（毎時0分）                           | 同じ。止めたい期間は `crons = []`                |
| `CRON_SECRET`（Worker secret）    | Vercel **Production** の `CRON_SECRET` と同じ値  | Vercel **Preview** の `CRON_SECRET` と同じ値     |
| `VERCEL_PROTECTION_BYPASS_SECRET` | 不要                                             | Previewに Deployment Protection がある場合に必要 |
| `HEALTHCHECKS_PING_URL`（任意）   | 本番用のチェック                                 | 検証用の別チェック（または未設定）               |
| 接続先DB / Stripe                 | 本番Supabase / Live mode                         | 検証Supabase / Test mode                         |

- `wrangler.toml` の `[env.production]` / `[env.staging]` に、それぞれ `vars`（`ENVIRONMENT`・`TARGET_URL`）と `triggers` を明示しています（環境間では継承されません）。
- **`CRON_SECRET` は本番と検証で別の値にしてください。** 検証の値が漏れても本番のCronを叩けないようにするためです。
- 検証のWorkerを使わない場合は、`wrangler deploy --env staging` を実行しなければ作成されません。
- 環境を指定しない `wrangler deploy` は使わないでください（`package.json` の `deploy:production` / `deploy:staging` を使う）。

## 検証環境のURLについて

`TARGET_URL`（検証）には、**デプロイのたびに変わらないURL**を指定します。

- Vercelの **Settings → Domains** で、検証用ドメインを `staging` ブランチ（Preview）に割り当てる（推奨。例: `staging.<独自ドメイン>`）
- または、ブランチエイリアスURL（`<project>-git-staging-<team>.vercel.app`）を使う

Previewに **Deployment Protection（Vercel Authentication）** が有効な場合、Workerからのリクエストは認証ページで 401 になります。Vercel Dashboard → **Settings → Deployment Protection → Protection Bypass for Automation** でシークレットを作成し、検証Workerに登録してください。

```bash
npx wrangler secret put VERCEL_PROTECTION_BYPASS_SECRET --env staging
```

Workerのログに `Vercel Deployment Protection is blocking the request` というヒントが出ている場合は、この設定が必要です。

## セットアップ（初回のみ）

前提: Cloudflare のアカウント、Node.js 20以上。

```bash
cd cloudflare/cron-worker
npm install
npx wrangler login
```

### 本番

```bash
# Vercel Production の CRON_SECRET と同じ値を入力する
npx wrangler secret put CRON_SECRET --env production
# 任意: Worker側の失敗も Healthchecks.io に通知する場合（本番用のping URL）
npx wrangler secret put HEALTHCHECKS_PING_URL --env production

npm run deploy:production
```

### 検証

1. `wrangler.toml` の `[env.staging.vars]` の `TARGET_URL` を、検証環境の安定したURLに書き換える。
2. 次を実行する。

```bash
# Vercel Preview の CRON_SECRET と同じ値（本番とは別の値）を入力する
npx wrangler secret put CRON_SECRET --env staging
# 必要な場合のみ
npx wrangler secret put VERCEL_PROTECTION_BYPASS_SECRET --env staging
npx wrangler secret put HEALTHCHECKS_PING_URL --env staging

npm run deploy:staging
```

`CRON_SECRET` は Vercel の Environment Variables（Production / Preview のそれぞれ）から確認できます。確認できない場合は新しい値を生成し、**その環境のVercelとWorkerの両方を同じ値に更新**して、Vercelを Redeploy してください（[README](../README.md#cron-jobの認証cron_secret)）。

> 既に（環境分けの前に）`tsukurist-cron` をデプロイ済みの場合: 本番のWorker名を同じ `tsukurist-cron` にしているため、`npm run deploy:production` で同じWorkerが更新され、登録済みのsecretはそのまま使われます。環境指定なしでデプロイしたときのvarsやCron設定は、環境指定ありのデプロイで置き換わります。念のため、デプロイ後に Dashboard → Workers & Pages → `tsukurist-cron` → **Settings** で、`ENVIRONMENT=production`・`TARGET_URL`・Cronが想定どおりか確認してください。

## Vercel Cronからの切り替え手順（本番）

Vercel Cronを残したままWorkerを有効にしても、`notification_log` により通知は重複しません。ただし2つのCronが同時に走る期間を作らないよう、次の順で切り替えてください。

1. 本番Workerをデプロイする（上記）。Cloudflare Dashboard → Workers & Pages → `tsukurist-cron` → **Settings → Trigger Events** に Cron `0 * * * *` が表示されることを確認する。
2. `vercel.json` の `crons` を削除する（本リポジトリでは `{}` にしている）。コミットして main にデプロイする。
3. Vercel Dashboard → Project → **Settings → Cron Jobs** に `/api/cron/deadline-notify` が残っていないことを確認する。
4. 翌朝 8:00 以降に、実行されたことを確認する（次項）。

> 切り替え直後の動作確認のために本番を手動実行すると、**実際に購読中ユーザーへ通知が送信**され、その日の `notification_log` が消費されます。本番の確認は翌朝の定時実行で行い、事前の動作確認は検証環境で行ってください。

## 実行の確認

確認は、Supabase の SQL Editor で**確認したい環境のプロジェクト**を開いて行います（本番と検証でDBが別です）。

```sql
-- Cron実行記録
select started_at, finished_at, status, sent, failed, detail
from public.job_runs
where job = 'deadline-notify'
order by started_at desc
limit 5;

-- Cronのログ
select logged_at, level, message, context
from public.app_logs
where logger = 'cron.deadline-notify'
order by logged_at desc
limit 20;
```

- Cloudflare側のログ: `npm run tail:production` / `npm run tail:staging`、または Dashboard → Workers & Pages → 対象Worker → **Logs**。ログの JSON に `environment`（production / staging）が入ります。
- `/api/health?deep=1`（Bearer必須）で、最後の成功が約2時間以内か確認できます（各環境のURLで）。
- Healthchecks.io の期待スケジュールは従来どおり Cron式 `0 * * * *`、タイムゾーン `UTC`、Grace Time `15 minutes` です。本番と検証で別のチェックを作ってください。

## 検証環境での動作確認（推奨の流れ）

本番に反映する前に、検証Workerで一通り確認できます。

1. 検証環境（Preview）に、通知を有効にしたテストユーザーと、7日以内に納期が来る未完了タスクを用意する。
2. 検証Workerのスケジュールを一時的に近い時刻（例: `crons = ["*/5 * * * *"]` のように数分後）にして `npm run deploy:staging` する。
3. `npm run tail:staging` と、検証Supabaseの `job_runs` / `app_logs` で、実行・通知送信を確認する。
4. 確認後、スケジュールを `0 * * * *` に戻して再デプロイする。

## ローカルでの動作確認

`.dev.vars`（Gitに含めない）を作ります。**`TARGET_URL` を必ずローカルか検証環境に向けてください**（本番に向けると実際に通知が送信されます）。

```
ENVIRONMENT=local
CRON_SECRET=<ローカル/検証環境のCRON_SECRET>
TARGET_URL=http://localhost:3000/api/cron/deadline-notify
```

```bash
npm run dev
# 別のターミナルで
curl "http://localhost:8787/__scheduled?cron=0+23+*+*+*"
```

## トラブルシューティング

| 症状                                                                       | 原因と対処                                                                                                                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workerのログに `HTTP 401`                                                  | その環境の `CRON_SECRET` がVercelと不一致（本番Workerに検証の値を入れた、など）、またはVercel側が16文字未満・未設定。同じ環境同士を同じ値にして、Vercelを Redeploy |
| 検証だけ `HTTP 401` で、ログに `Vercel Deployment Protection ...` のヒント | Previewの保護に弾かれている。`VERCEL_PROTECTION_BYPASS_SECRET` を検証Workerに登録                                                                                  |
| `TARGET_URL is still a placeholder`                                        | 検証の `TARGET_URL` が未設定。`wrangler.toml` を書き換えて `npm run deploy:staging`                                                                                |
| `HTTP 30x`                                                                 | `TARGET_URL` がwww・旧ドメインなどリダイレクトされるURL。正規URLに修正                                                                                             |
| `HTTP 503`（`maintenance`）                                                | メンテナンスモード中。`/api/cron/*` は許可リストにないため拒否される。メンテ終了後の次回実行で復旧（必要なら `middleware.ts` の許可リストに追加を検討）            |
| `HTTP 403`（Vercel Firewall / Attack Challenge Mode）                      | Vercel側でボット対策が有効。CloudflareからのリクエストをVercel Firewallで許可（`X-Cron-Source` ヘッダーやUser-Agentで識別）するか、チャレンジモードを解除          |
| `job_runs` に記録がない                                                    | Workerが実行されていない、またはリクエストが認証で弾かれている。`tail` と Triggers の設定、見ているSupabaseプロジェクト（本番/検証）を確認                         |
| `TimeoutError`                                                             | Vercelの `maxDuration`（60秒）超過。`job_runs.detail` に `truncated` が出ていないか、購読数の増加を確認                                                            |

## 補足

- Cloudflare Workers の Cron Trigger は Free プランでも利用できます。アカウントあたりのCron Trigger数に上限があり、本番・検証で2つ使います。上限・料金は Cloudflare の最新のページで確認してください。
- Vercel Cron（Hobby）は1日1回までの制限があり、Productionデプロイでしか動きませんでした。Cloudflareに移すとこの制約がなくなり、検証環境でもCronを動かせます。ユーザーごとの通知時刻（`user_settings.notify_hour`・日本時間）に対応するため、毎時実行にしています。ルート側が「現在のJST時 = notify_hour」のユーザーだけを対象にし、`user_settings` が無いユーザーは8時として扱います。対象ユーザーのうち、各ユーザーの `notify_days`（既定は当日〜7日前）または各タスクの `remind_before_days` に当たるタスクがある場合にだけ送信します（納期は30日先までを取得し、判定はルート内で行います）。通知時刻を変えても、`notification_log` により同じ日の通知は1回までです。古い記録・ログの削除は、日本時間4時台の実行でのみ行います。Cloudflareの無料プランでも、Cron Triggerは1本のままで足ります。
- ログの保持期間を過ぎた `app_logs` の削除はこのCronに含まれます。Cronを止めると、その環境のログが削除されなくなります。
