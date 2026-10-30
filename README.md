# 📋 ツクリスト

依頼・タスクの納期、金額、確認用画像をまとめて管理できる Web アプリです。
イラスト依頼に限らず、デザイン・動画・執筆・開発など外注・制作物の依頼全般で使えます。

**技術構成:** Next.js 14 (App Router) + Supabase + Vercel

---

## 目次

- [📋 ツクリスト](#-ツクリスト)
  - [目次](#目次)
  - [1. Supabase セットアップ](#1-supabase-セットアップ)
    - [1-1. プロジェクト作成](#1-1-プロジェクト作成)
    - [1-2. DB・RLS・Storage の構築](#1-2-dbrlsstorage-の構築)
    - [1-3. 認証プロバイダーの設定](#1-3-認証プロバイダーの設定)
    - [1-4. URL Configuration](#1-4-url-configuration)
    - [1-5. API キーの確認](#1-5-api-キーの確認)
  - [2. ローカル動作確認（任意）](#2-ローカル動作確認任意)
    - [初回セットアップ（1 回だけ）](#初回セットアップ1-回だけ)
    - [起動](#起動)
  - [3. Vercel デプロイ](#3-vercel-デプロイ)
  - [4. 外部サービス設定](#4-外部サービス設定)
    - [Resend（メール送信）](#resendメール送信)
    - [Stripe（サブスクリプション）](#stripeサブスクリプション)
    - [Web Push（プッシュ通知）](#web-pushプッシュ通知)
    - [Cron Jobの認証（CRON\_SECRET）](#cron-jobの認証cron_secret)
    - [ログの保存（app\_logs）](#ログの保存app_logs)
  - [5. 管理者設定](#5-管理者設定)
  - [6. 機能一覧](#6-機能一覧)
  - [7. プラン制限](#7-プラン制限)
  - [8. パフォーマンスに関する実装方針](#8-パフォーマンスに関する実装方針)
  - [9. SEO・広告運用](#9-seo広告運用)
  - [10. デザイン方針](#10-デザイン方針)
  - [開発者向け資料](#開発者向け資料)

---

## 1. Supabase セットアップ

### 1-1. プロジェクト作成

[supabase.com](https://supabase.com) → **New project** でプロジェクトを作成します。

### 1-2. DB・RLS・Storage の構築

DBの変更・反映方法は [docs/database-operations.md](docs/database-operations.md) を参照してください。
ログ保存用の `app_logs` テーブルも、同じmigrationの手順で作成されます（[ログの保存](#ログの保存app_logs)参照）。

### 1-3. 認証プロバイダーの設定

**Dashboard → Authentication → Providers** で以下を有効化します。

**Email**
- Email/Passwordを利用する場合は有効化します。
- メール確認の有効・無効は本番と検証環境で意図を分けて設定してください。本番で無効化する場合は、本人確認を省略する影響を考慮します。

**Google**
1. [Google Cloud Console](https://console.cloud.google.com) で OAuth アプリを作成
2. Client ID / Secret を Supabase の Google プロバイダー設定に入力
3. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

> 📄 詳細は [docs/google-login.md](docs/google-login.md) を参照してください。

### 1-4. URL Configuration

**Dashboard → Authentication → URL Configuration** で設定します。

| 項目          | 値                                                                                 |
| ------------- | ---------------------------------------------------------------------------------- |
| Site URL      | `https://tsukurist.com`                                                            |
| Redirect URLs | `https://tsukurist.com/**`、使用するVercel Preview URL、`http://localhost:3000/**` |

Vercel Preview の認証リダイレクトを使う場合は、実際に使うPreview URLもRedirect URLsに追加します。Googleログインを使う場合、Google Cloud Consoleの承認済みリダイレクトURIは `https://<project-ref>.supabase.co/auth/v1/callback` です。詳しくは [Googleログイン設定](docs/google-login.md) を参照してください。

### 1-5. API キーの確認

**Dashboard → Project Settings → Data API** で以下をメモしておきます。

| 項目             | 環境変数名                                         |
| ---------------- | -------------------------------------------------- |
| Project URL      | `NEXT_PUBLIC_SUPABASE_URL`                         |
| anon public key  | `NEXT_PUBLIC_SUPABASE_ANON_KEY`                    |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` ⚠️ 外部に漏らさないこと |

---

## 2. ローカル動作確認（任意）

`vercel dev` を使うと、コミット・デプロイなしでローカルからVercel環境変数を使ってアプリを確認できます。開発時は誤操作を避けるため、可能な限り検証用Supabaseプロジェクトを接続してください。

### 初回セットアップ（1 回だけ）

```bash
# 1. Vercel CLI をインストール
npm i -g vercel

# 2. 依存パッケージをインストール
npm install

# 3. Vercel プロジェクトと紐付け（ブラウザでログイン・プロジェクト選択）
vercel link

# 4. 環境変数をローカルに取得（手入力不要）
vercel env pull .env.local

# 5. .env.local を Git 管理対象外にする
echo ".env.local" >> .gitignore
```

> ⚠️ `.env.local` には本番 DB の接続情報が含まれるため、**絶対にコミットしないでください。**

### 起動

```bash
vercel dev
```

`http://localhost:3000` でアプリが起動します。HTML も API も全てローカルで動作します。
ローカル開発中（`NODE_ENV` が `production` 以外）は、ログのレベルが `DEBUG` になります。ローカルのログを `app_logs` に保存したくない場合は `.env.local` に `LOG_DB_ENABLED=false` を設定してください。

---

## 3. Vercel デプロイ

1. GitHub にリポジトリを push する
2. [Vercel](https://vercel.com) → **Add New Project** → リポジトリを選択
3. Project → **Settings → Domains** に `tsukurist.com` と `www.tsukurist.com` を登録し、表示されたDNSレコードをCloudflareのDNSに設定します。`www.tsukurist.com` はVercelで `tsukurist.com` にリダイレクトする設定にします。DNSレコードはVercelが表示する値を使い、メール用のMX/TXTレコードは削除・上書きしないでください。
4. **Environment Variables** に以下を追加してデプロイ（雛形は `.env.example`）

| 環境変数                                 | 値                                                            | 備考                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`               | Supabase の Project URL                                       |                                                                                                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | Supabase の anon key                                          |                                                                                                                        |
| `SUPABASE_SERVICE_ROLE_KEY`              | Supabase の service_role key                                  | ⚠️ サーバーサイド専用                                                                                                   |
| `RESEND_API_KEY`                         | Resend の API キー                                            |                                                                                                                        |
| `SUPPORT_EMAIL`                          | サポート窓口兼管理通知の受信先・送信元                        | 本番・Preview とも `support@tsukurist.com`                                                                             |
| `NOREPLY_EMAIL`                          | 自動通知メールの送信元                                        | 本番・Preview とも `noreply@tsukurist.com`                                                                             |
| `NEXT_PUBLIC_APP_URL`                    | アプリの公開URL                                               | Production: `https://tsukurist.com`。Preview: 対象Vercel PreviewのURL（パスなし）。Webhookメール・通知のリンク先に使用 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`     | Stripe の公開鍵                                               |                                                                                                                        |
| `STRIPE_SECRET_KEY`                      | Stripe の秘密鍵                                               | ⚠️ サーバーサイド専用                                                                                                   |
| `STRIPE_WEBHOOK_SECRET`                  | Stripe Webhook のシークレット                                 |                                                                                                                        |
| `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` | 上位プラン変更・期間終了時解約対応ポータルの Configuration ID | Stripe Dashboard で作成した設定を指定                                                                                  |
| `STRIPE_STANDARD_PRICE_ID`               | スタンダードプランの Price ID                                 | サーバーサイド用                                                                                                       |
| `STRIPE_PREMIUM_PRICE_ID`                | プレミアムプランの Price ID                                   | サーバーサイド用                                                                                                       |
| `NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID`   | スタンダードプランの Price ID                                 | フロント用                                                                                                             |
| `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`    | プレミアムプランの Price ID                                   | フロント用                                                                                                             |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`           | Web Push の公開鍵                                             |                                                                                                                        |
| `VAPID_PRIVATE_KEY`                      | Web Push の秘密鍵                                             |                                                                                                                        |
| `VAPID_EMAIL`                            | Web Push 送信元メール                                         | `mailto:support@tsukurist.com`                                                                                         |
| `CRON_SECRET`                            | Cron Job 認証用シークレット                                   | ⚠️ 16文字以上。自分で生成する（[4. 外部サービス設定](#cron-jobの認証cron_secret)参照）                                  |
| `HEALTHCHECKS_PING_URL`                  | 死活監視の ping URL（任意）                                   | Healthchecks.io 等で作成。Cron 成功のたびに ping し、途切れると通知される                                              |
| `LOG_LEVEL`                              | ログの最低レベル（任意）                                      | `TRACE`〜`FATAL`。未設定時は本番 `INFO`。詳細は[ログの保存](#ログの保存app_logs)                                       |
| `LOG_LEVELS`                             | ロガー名ごとのレベル（任意）                                  | 例: `stripe=WARN,cron.deadline-notify=DEBUG`                                                                           |
| `LOG_DB_LEVEL`                           | DBに保存する最低レベル（任意）                                | 未設定時は `INFO`。保存量を減らすなら `WARN`                                                                           |
| `LOG_DB_ENABLED`                         | DBへのログ保存（任意）                                        | `false` で無効化（コンソール出力のみ）                                                                                 |

VercelのEnvironment Variablesは、ProductionとPreviewそれぞれに設定します。`NEXT_PUBLIC_APP_URL` はProductionでは `https://tsukurist.com`、PreviewではVercelのPreview URLにしてください。Stripe CheckoutとCustomer Portalの戻り先はリクエスト元のoriginから生成されます。Previewも `support@tsukurist.com` と `noreply@tsukurist.com` から送信します。問い合わせ・管理通知は本番のサポート受信箱に届くため、Previewでのメール・決済・アカウント削除テストには注意してください。

> ⚠️ 環境変数を追加・変更した後は必ず **Redeploy** すること

---

## 4. 外部サービス設定

### Resend（メール送信）

アカウント削除申請の通知メール、お問い合わせフォームの管理者通知・ユーザー自動返信メールに使用します。
メールの送信元・件名・本文テンプレートは `lib/email-templates.ts` に集約しています。文面を変更するときはこのファイルを編集してください。

1. [resend.com](https://resend.com) でアカウントを作成し、送信ドメイン `tsukurist.com` を追加します。
2. Resendが表示するSPF/DKIM等のDNSレコードをCloudflareに登録し、Resend側でドメイン認証が完了したことを確認します。既存のSPFレコードがある場合は、別のSPFレコードを追加せず、送信サービスを同じレコードに統合してください。
3. **Dashboard → API Keys → Create API Key** で発行し、`RESEND_API_KEY` としてVercelのProduction・Preview両方に設定します。
4. VercelのProduction・Preview両方で `SUPPORT_EMAIL=support@tsukurist.com`、`NOREPLY_EMAIL=noreply@tsukurist.com` を設定します。問い合わせ通知・管理通知は `SUPPORT_EMAIL` を送信元・受信先として使用し、ユーザー向け自動返信や決済通知は `NOREPLY_EMAIL` を送信元として使用します。両アドレスともResendで認証した `tsukurist.com` ドメインを使用します。
5. 受信にはメールボックス提供元が必要です。Cloudflare Email Routingを使う場合は `support@tsukurist.com` から既存の受信箱への転送を設定し、Cloudflareに案内されるMX/TXTレコードを追加します。メールボックスサービスを契約する場合は、そのサービスのMXレコードを設定してください。Cloudflareでのドメイン取得だけではメールボックスは作成されません。

Preview環境も認証済みドメインからメールを送るため、検証メールの宛先に注意してください。Supabase Authの確認メール・パスワード再設定メールも独自ドメインから送るには、Supabase Dashboard → **Project Settings → Authentication → SMTP Settings** でカスタムSMTPを有効にし、ResendのSMTP情報（ホスト・ポート・ユーザー名・APIキー）と送信元 `noreply@tsukurist.com` を設定します。Previewでの認証メールも本番ドメインから送信されます。

### Stripe（サブスクリプション）

設定手順・Customer Portal・Webhook・テストから本番切り替えまでの詳細は [Stripe運用ガイド](docs/stripe-guide.md) を参照してください。

本番の商品はスタンダード（月額300円）・プレミアム（月額800円）の recurring JPY Price とし、Price IDをサーバー・フロント用の各環境変数へ登録します。本番Webhookは `https://tsukurist.com/api/stripe/webhook` に設定します。Webhook対象イベント、Portal Configuration IDの取得、Preview/Test modeの分離などはStripe運用ガイドを参照してください。

> テストキー（`sk_test_`）と本番キー（`sk_live_`）を混在させないこと。

アップグレード時は残り期間に応じた差額を即時請求し、解約は契約期間終了時に反映します。自動返金は行わず、返金の相談はサポート窓口で受け付けます。

### Web Push（プッシュ通知）

納期リマインダー通知（毎朝 8 時・日本時間）に使用します。

```bash
# VAPID キーペアの生成
npx web-push generate-vapid-keys
```

生成された公開鍵・秘密鍵をそれぞれ `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` に設定します。

> iOS でのプッシュ通知はホーム画面追加（PWA）が必須です（iOS 16.4 以降）。

### Cron Jobの認証（CRON_SECRET）

納期通知は **Cloudflare Workers の Cron Trigger**（**毎時0分**）が、`/api/cron/deadline-notify` を呼び出して実行します。ルート側で、ユーザーが設定した通知時刻（日本時間・既定8時。ユーザーメニューの「通知時刻」で0〜23時から選択）に一致するユーザーにだけ送信します。Workerのコードは `cloudflare/cron-worker/` にあり、**本番(production)用と検証(staging)用の2つのWorker**として別々にデプロイします（Vercelの Production / Preview の環境分離に対応）。セットアップ・切り替え手順・トラブルシューティングは [Cloudflare Cron 運用ガイド](docs/cloudflare-cron.md) を参照してください。
処理本体はVercel側のルートです。ユーザーごとの「通知する日」（`user_settings.notify_days`。納期の何日前か。既定は当日〜7日前）またはタスク個別のリマインド（`tasks.remind_before_days`）に当たる未完了タスクがあるユーザーのうち、プッシュ通知を有効にしている端末へ送信し、日本時間4時台の実行（1日1回）で、期限切れの記録（通知ログ・Cron実行記録・Stripeイベント記録）と、保持期間を過ぎたアプリログ（`app_logs`）も削除します。
Cloudflareの Cron 式は `0 * * * *`（毎時0分）です。Healthchecks.ioもCron式 `0 * * * *`、タイムゾーン `UTC`、Grace Time `15 minutes` に設定してください。`/api/health?deep=1` は最終成功が120分以内かを確認します。
このルートは **`Authorization: Bearer <CRON_SECRET>` ヘッダーが一致しないリクエストを 401 で拒否**します
（`CRON_SECRET` が未設定・16 文字未満の場合も常に拒否）。`vercel.json` には `crons` を設定しません（Vercel Cronは使いません）。

`CRON_SECRET` は外部サービスから発行されるものではなく、**自分でランダム文字列を生成**して、**同じ環境のVercelとCloudflare Workerの両方に同じ値**を登録します。本番と検証では**別の値**にしてください。

```bash
# 1. 生成（どちらか）
openssl rand -hex 32
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Vercel Dashboard → Project → Settings → Environment Variables** に `CRON_SECRET` を追加（Production と Preview それぞれ別の値）して **Redeploy** する
3. Cloudflare Worker に、同じ環境の値を登録する：
   `cd cloudflare/cron-worker && npx wrangler secret put CRON_SECRET --env production`（Vercel Production の値）
   `npx wrangler secret put CRON_SECRET --env staging`（Vercel Preview の値）
4. ローカルで試す場合は `.env.local` に同じ値を書く（`vercel env pull .env.local` でも取得可）

動作確認:

```bash
# ヘッダーなし → 401 になること（通知は送られない）
curl -i https://tsukurist.com/api/cron/deadline-notify
```

> ⚠️ 正しいヘッダー付きで呼ぶと**実際に購読中ユーザーへ通知が送信されます**。
> 手動実行は検証環境で行ってください。本番で試すと、その日の通知枠（`notification_log`）を消費します。
>
> ⚠️ シークレットを `wrangler.toml`・`vercel.json` の URL（`?secret=...`）に書かないこと。リポジトリ・ログ・履歴に残ります。
> 過去にコミットしたシークレットは**必ず再発行（ローテーション）**し、VercelとCloudflareの両方を更新してください。
>
> 本番Workerは本番URL、検証Workerは検証環境の安定したURL（`wrangler.toml` の `[env.staging.vars]` の `TARGET_URL`）をそれぞれ呼び出します。デプロイは `npm run deploy:production` / `npm run deploy:staging` を使い、環境を指定しない `wrangler deploy` は使わないでください。

### ログの保存（app_logs）

Vercelのランタイムログは保持期間が短いため、サーバー側のログは `lib/server/logger.ts`（log4j2風のロガー）で出力し、Supabaseの `app_logs` テーブルに保存します（Vercelのログにも従来どおり出力されます）。

- レベル: `TRACE` / `DEBUG` / `INFO` / `WARN` / `ERROR` / `FATAL`
- 出力先: コンソール（Vercelログ）と `app_logs`（`LOG_DB_LEVEL` 以上のみ。既定は `INFO` 以上）
- 各リクエストに `request_id`（Vercelの `x-vercel-id`）とユーザーID等が自動で付き、1リクエストの流れを追えます
- パスワード・トークン等のキーは自動でマスクされます。個人情報（お問い合わせ本文など）は記録しません
- 保持期間: `INFO` 以下は14日、`WARN` 以上は90日。毎日のCron（Cloudflare Worker経由）が古いログを削除します
- `app_logs` は `service_role` 専用で、クライアントからは読めません。調べるときはSupabaseの SQL Editor を使います

セットアップ:

1. `supabase/migrations/20261024000000_V2.0.0_app_logs.sql` を検証環境→本番の順で適用する（[DB運用ガイド](docs/database-operations.md)）
2. 必要に応じて `LOG_LEVEL` などの環境変数を設定して Redeploy する（未設定でも動作します）

```sql
-- 直近のエラー（例）
select logged_at, logger, message, context
from public.app_logs
where level_value >= 50
order by logged_at desc
limit 50;
```

使い方・環境変数・調査用SQL・注意事項の詳細は [ログ運用ガイド](docs/logging-guide.md) を参照してください。

---

## 5. 管理者設定

1. アプリにアクセスして**新規登録**する
2. **Dashboard → Authentication → Users** から自分の UUID をコピー
3. **SQL Editor** で以下を実行：

```sql
update user_profiles
set is_admin = true
where id = 'ここに UUID を貼る';
```

4. ログイン後、右上のユーザーメニュー → **「管理者ページ」** から管理画面へ

管理者ページ URL: `/admin`
お知らせ・バージョン管理 URL: `/admin/notifications`

管理者は管理画面の利用前にTOTP方式の二段階認証（認証アプリ）が必須です。初回アクセス時に画面のQRコードを認証アプリで読み取り、確認コードを入力して設定してください。以後、AAL2の認証状態でないセッションから管理機能は利用できません。
管理者ページと通知・バージョン情報の管理操作を有効にするには、[DB運用ガイド](./docs/database-operations.md)に従って最新の管理者MFA migrationを適用します。

---

## 6. 機能一覧

**タスク管理**
- ✅ タスク（依頼）の登録・編集・削除
- ✅ ステータス管理（依頼済み / 確認中 / 対応中 / 完成 / キャンセル）
- ✅ 納期 7 日前の警告表示
- ✅ ステータスのプルダウン検索・並び替え
- ✅ タグ（カテゴリ・案件名など。1タスク10個・全体100個まで。タスクのフォームで作成・選択、一覧のプルダウンで絞り込み、ユーザーメニューから名前変更・削除）
- ✅ カレンダービュー（月・週。納期の日にタスクを表示。ステータス・検索の絞り込みと連動。表示形式は記憶）
- ✅ 開閉式の詳細検索パネル（既定は折りたたみ）：キーワード検索（件名・依頼先名・連絡先・メモ）、
  依頼日・納期のFrom-To日付範囲検索、金額の範囲検索
- ✅ 検索結果の合計金額表示（チェックボックスで切替、既定は非表示）
- ✅ タスク個別のリマインド（納期の何日前に追加で通知するか。0〜30日前。全体の「通知する日」とは別に届く）

**画像**
- ✅ タスク登録時に画像をまとめてアップロード（新規登録フォームから追加可能）
- ✅ 確認用・作業中・完成・その他の画像アップロード（Supabase Storage `task-images`）
- ✅ 一覧カードにサムネイル表示（最初の 1 枚。画像枚数はサムネイルに重ねたバッジで表示。署名付きURLはまとめて1回で取得）
- ✅ タスク一覧カードはコンパクトな2行構成（タイトル+ステータス／依頼先名+納期のみ）。詳細な日付はカードをタップした先の詳細画面で確認
- ✅ 画像の拡大プレビュー・削除・ダウンロード（元画質保持）
- ✅ プランごとの画像枚数制限

**認証・アカウント**
- ✅ メール / パスワード・Google ログイン
- ✅ パスワードリセット（メール送信）
- ✅ 表示名の設定
- ✅ アカウントの即時削除（本人がユーザーメニューから実行。メールアドレス＋パスワード（Googleのみの場合は直近ログイン）で本人確認。Stripeの即時解約・画像削除を含む）
- ✅ ユーザーごとにデータが完全分離（RLS）
- ✅ パスワードの設定・変更（ログイン後の画面から。Google登録ユーザーは初回設定可）
- ✅ 直近のログイン方法の表示（Googleログイン時にアバターへバッジ表示）
- ✅ ログイン画面での前回ログイン方法の表示（HttpOnly Cookie + サーバーAPI経由、DBが正）
- ✅ メールアドレス登録時の表示名必須入力
- ✅ Googleアカウント登録時、Google側の名前を表示名として自動反映
- ✅ 最終ログイン日時の記録

**通知**
- ✅ プッシュ通知（既定は毎朝8時・日本時間。ユーザーメニューの「通知時刻」で0〜23時に変更可。「通知する日」で納期の何日前に通知するかを選択（当日・1〜7日前・14日前。既定は当日〜7日前）。同じ日の重複送信防止。Cron は `CRON_SECRET` のBearer認証で保護。複数端末で購読可能）
- ✅ 管理者がお知らせを新規作成した時、配信対象ユーザーへプッシュ通知
- ✅ 管理者が新しいバージョン情報を登録した時、購読中の全ユーザーへプッシュ通知
- ✅ お知らせ・リリースノート（未読バッジ通知・モーダル表示。取得・未読判定は`hooks/useNotifications.ts`に一本化）
- ✅ アカウント作成日より前に公開されたお知らせ・リリースノートは自動的に既読扱い（新規登録直後に過去の告知で未読バッジが立たない）
- ✅ お問い合わせフォーム（モーダル表示・管理者通知。自動返信はログイン済みユーザーのみ。IP／ユーザー単位のレート制限あり）

**課金**
- ✅ Stripe サブスク（月額課金・解約・カスタマーポータル）
- ✅ プレミアムへのアップグレード時は残り期間分の差額を日割り請求。解約は期間終了時に反映し、自動返金は行わない
- ✅ 支払い失敗への対応（`past_due`の記録・ユーザーへの連絡メール・画面上の警告と支払い方法の更新ボタン。復旧時に自動で戻る）
- ✅ Webhookの冪等化・順序非依存（最新のサブスク状態をStripeから取得して反映）

**運用・監視**
- ✅ `/api/health`（死活監視。`?deep=1` + Bearer でCronの最終成功時刻まで確認）
- ✅ 納期通知CronをCloudflare Workers（Cron Trigger）から起動（Bearer認証・リトライ付き。本番/検証で別Worker・別secret。`cloudflare/cron-worker/`）
- ✅ Cronの実行記録（`job_runs`）と、異常時の管理者メール・Healthchecks.io通知（任意）
- ✅ アプリログの永続化（log4j2風ロガー `lib/server/logger.ts`。コンソール + Supabase `app_logs`。リクエストID・ユーザーID付き、機密キーの自動マスク、保持期間を過ぎたログはCronで自動削除）
- ✅ CI（型チェック・lint・ビルド）

**管理者**
- ✅ ユーザー一覧・プラン変更・ユーザー削除
- ✅ お知らせ管理（登録・編集・削除、全員・プラン別・ユーザー指定の配信対象設定と新規作成時のプッシュ通知）
- ✅ バージョン管理（登録・編集・削除・更新内容管理、新規登録時の全購読者向けプッシュ通知）
- ✅ メンテナンスモード（管理者ページから公開停止・再開、利用者向け案内文を設定）

**UI / UX**
- ✅ 共通CSSトークンとコンポーネントスタイル（`app/globals.css`、`app/components.css`）
- ✅ 自前SVGのラインアイコン（`components/TaskShared.tsx` の `Icon`。絵文字・記号文字は使わない）
- ✅ 全モーダル固定サイズ統一（`height: calc(100vh - 32px)` + `maxHeight: 600`）
- ✅ タイトル・ボタン固定 / コンテンツスクロールのモーダル構造
- ✅ モーダル表示時の背景スクロールロック（iOS Safari 対応）
- ✅ ユーザーメニューのテキスト折り返し防止

**その他**
- ✅ 共有用公開ページ（公開項目を選択。SNSリンク最大3件、実績画像最大20枚・各説明文最大120文字。タスク名や依頼詳細は公開しない）
- ✅ デモモード（ログイン不要・メモリのみ・お知らせ・お問い合わせボタン付き。検索UX・お知らせ閲覧はTaskAppと共通コンポーネント、お知らせは未読管理なしの読み取り専用）
- ✅ PWA 対応（ホーム画面追加。Androidではインストール操作、iOSではSafariの共有メニューから追加する方法を案内するバナーを表示。表示履歴はAPI管理のHttpOnly Cookieに保存）
- ✅ LP・利用規約・プライバシーポリシー・特定商取引法ページ
- ✅ 使い方ガイド（`/guide` + `/guide/[slug]` の9ページ。実画面の部品を使った図・折りたたみ・目次・「次に読むなら」・ページ途中のデモ誘導。本文は `lib/guide-pages.tsx` で一元管理。スクリーンショット/GIFは `<Shot />` で追加）
- ✅ 無料ツール（`/tools`。納期逆算カレンダー・外注費の見積もり計算・依頼書テンプレート作成。ログイン不要で、入力内容はブラウザ内でのみ処理）

---

## 7. プラン制限

| プラン       | 月額 | 画像保存（アカウント合計） |
| ------------ | ---- | -------------------------- |
| 無料         | ¥0   | 10 枚まで                  |
| スタンダード | ¥300 | 50 枚まで                  |
| プレミアム   | ¥800 | 無制限                     |

---

## 8. パフォーマンスに関する実装方針

ログイン直後の表示速度や、お知らせモーダルの表示速度の改善のために取り入れている
実装方針です。今後コードを追加・変更する際もこの方針に沿ってください。

- **画像の署名付きURLはまとめて取得する**：画像を複数枚扱う場面（一覧のサムネイル・
  詳細モーダルなど）では、`lib/supabase.ts` の `getSignedImageUrl()`（1枚用）を
  ループで呼ばず、`getSignedImageUrls(paths: string[])`（複数枚まとめて署名するAPI）
  を使うこと。1枚ずつ呼ぶと画像枚数分のリクエストが発生するN+1問題になる。
- **`getSession()` を優先する**：クライアント側でログイン中ユーザーのidやemailを
  参照するだけの場面では、Authサーバーへの検証往復が発生する `supabase.auth.getUser()`
  ではなく、ローカルのセッション情報を返す `supabase.auth.getSession()` を使うこと。
  RLSで保護された書き込み操作はJWT署名がサーバー側で検証されるため、安全性は変わらない。
- **依存関係のないクエリは並列実行する**：複数のSupabaseクエリを実行する際、
  互いの結果に依存しないものは `await` を直列に並べず `Promise.all` でまとめて実行すること。
- **ローディング状態は「本体データ」が揃った時点で解除する**：サムネイルなど
  付随的なデータの取得を待ってから読み込み中表示を解除しないこと。本体（一覧・詳細等）が
  表示できる状態になったら先に画面を出し、付随データは裏で継続取得して差し込む。
- **開かれるまで使わないUIはコード分割する**：モーダルなど「常にマウントされているが
  ユーザー操作まで使われない」コンポーネントは `next/dynamic`（`{ ssr: false }`）で
  読み込み、メイン画面の初期JSバンドルに含めないこと（`NotificationsModal`・
  `ContactModal`・ログイン画面の`DemoApp`が実装例）。
- **外部キー列にはインデックスを張る**：PostgreSQLは外部キーに自動でインデックスを
  作成しないため、新しいテーブル・外部キー列を追加する際はインデックス追加も
  合わせて検討すること（`supabase/migrations/20260922000000_V1.2.0_add_performance_indexes.sql`
  が既存テーブルへの追加例）。
- **サードパーティスクリプトは`lazyOnload`を優先する**：GA・広告など計測系の
  外部スクリプトは、メインコンテンツの表示・操作可能化をブロックしないよう
  `next/script`の`strategy="lazyOnload"`を基本とすること（AdSense loaderのみ、
  `data-nscript`属性を避けるため通常の`<script async>`）。
- **同じデータを複数箇所で使うなら共有フックに寄せる**：ヘッダーの未読バッジと
  お知らせモーダルのように、複数のUIが同じデータ（お知らせ・リリースノート等）を
  必要とする場合は、コンポーネントごとに個別取得させず`hooks/`配下に共有フックを
  作り、データ取得元を1つに統一すること（実装例: `hooks/useNotifications.ts`）。
- **本番とデモで表示・検索ロジックが同じ部分は共通化する**：`TaskApp.tsx`
  （本番）と`DemoApp.tsx`（ログイン不要のデモ）は見た目・検索条件が同じである
  べきなので、定数・フォーマッタ・UI部品（一覧カードの`TaskListCard`・`Icon`を含む）は
  `components/TaskShared.tsx`、検索・フィルタ・並び替えのロジックは
  `hooks/useTaskSearch.ts`、検索バーのUIは`components/TaskSearchBar.tsx`に集約している。
  新しい検索条件や見た目の変更は、この3ファイルを編集し、
  `TaskApp.tsx`/`DemoApp.tsx`側は極力変更しないこと。
  一方、画像アップロード・プラン制限など実装の意味が本質的に異なる部分
  （Supabase Storage・課金プラン vs. メモリのみの疑似アップロード）は
  無理に共通化していない。
- **スマホの狭い画面幅ではflexWrapによる折り返しに注意する**：一覧カードのように
  情報量が多い行は、`flexWrap: "wrap"`で複数要素を並べると狭い画面幅で
  折り返しが多発し、カードの高さが不安定に伸びてしまう。折り返しを許容しない
  1行に収めたい場合は、重要度の低い項目を削るか、`flex: "1 1 0%"` +
  `minWidth: 0` + `text-overflow: ellipsis`で省略表示にすること
  （実装例: `components/TaskShared.tsx`の`TaskListCard`）。
- **サーバー側のログは `console.*` ではなくロガーで出す**：APIルート・`lib/server/` では
  `lib/server/logger.ts` の `getLogger()` を使い、APIルートは `withRequestLog()` で包むこと
  （リクエストID・所要時間・未捕捉例外の記録と、サーバーレス終了前のログ書き込み完了待ちを自動で行う）。
  ページ描画（Server Component）では出力後に `await flushLogs()` を呼ぶ。パスワード・トークン・
  個人情報（お問い合わせ本文・メールアドレスなど）はログに含めないこと。Edgeランタイム
  （`middleware.ts`）では使えない。詳細は [ログ運用ガイド](docs/logging-guide.md)。

---

## 9. SEO・広告運用

Google Search Console・Google AdSenseの設定は、[docs/seo-ads-guide.md](docs/seo-ads-guide.md) を参照してください。
トップページ `/` は未ログイン時にサービス紹介、ログイン中はアプリを表示します。公開対象URL・`noindex`・サイトマップ・広告対象を変更する場合は、SEO・広告ガイドに沿って一緒に確認してください。

- 広告を表示するのは `/`（未ログイン時）・`/guide`・`/guide/*`・`/tools`・`/tools/*` だけです（`components/AdSenseLoader.tsx`）。`/terms` `/privacy` `/tokusho` や、ログイン後の画面・デモには表示しません。
- ガイド・無料ツールは `app/sitemap.ts` が自動でサイトマップに追加します。ページの追加手順、スクリーンショット・GIF用 `<Shot />` の使い方は [使い方ガイド・無料ツールの運用ガイド](docs/content-guide.md) を参照してください。

---

## 10. デザイン方針

色・角丸・影などの実装値は `app/globals.css` と `app/components.css` が基準です。[DESIGN.md](DESIGN.md) はAppleのWebサイトを分析した参考資料であり、アプリ画面の完全な仕様書ではありません。

- 色・角丸・影・フォントは `app/globals.css` のトークン（`var(--xxx)`）、
  ボタン・カード・バッジ・モーダル等は `app/components.css` の共通クラスで定義する。
  **ページ・コンポーネント側で色や影をハードコードしない。**
- アクセントは Action Blue（`--accent` `#0066cc`）の**単色のみ**。第二のブランド色・グラデーションは使わない
  （成功・警告・危険などの状態色は別トークン）。
- 影は浮遊する面（モーダル・ユーザーメニュー）のみ。カード・ボタン・テキストには付けない。
- 太さは 400 / 600（500 は使わない）。ボタン押下は `scale(0.95)`。
- アイコンは `components/TaskShared.tsx` の `<Icon name="..." />`（自前SVG）。
  新しいアイコンは `ICON_PATHS` に追加し、絵文字・記号文字（✓ ← › ▾ ×など）は使わない。
  ブランドロゴ（Google の G）は線アイコンにせず、`GoogleLogo`（`TaskShared.tsx`・公式SVG）を使う。

---

## 開発者向け資料

- [開発・運用ガイド](docs/development-guide.md)：構成、実装ルール、検証・リリース手順
- [DB運用ガイド](docs/database-operations.md)：マイグレーション、RLS、権限付与、`app_logs`
- [ログ運用ガイド](docs/logging-guide.md)：ロガーの使い方、環境変数、保持期間、調査用SQL
- [Cloudflare Cron 運用ガイド](docs/cloudflare-cron.md)：納期通知Cronの構成、デプロイ、切り替え手順、トラブルシューティング
- [Googleログイン設定](docs/google-login.md)：OAuth・リダイレクトURL設定
- [Stripe運用ガイド](docs/stripe-guide.md)：商品・Webhook・Customer Portal・テスト運用
- [独自ドメイン設定・移行ガイド](docs/domain-migration.md)：本番ドメイン、Vercel Preview、メール設定
- [SEO・広告ガイド](docs/seo-ads-guide.md)：Search Console・AdSense運用
- [使い方ガイド・無料ツールの運用ガイド](docs/content-guide.md)：ガイド・ツールの追加手順、図と `<Shot />`（スクリーンショット・GIF）の使い方、広告対象ページ、公開前チェックリスト
