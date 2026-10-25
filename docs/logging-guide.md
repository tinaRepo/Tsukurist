# ログ運用ガイド

Vercelのランタイムログは保持期間が短く、検索もしづらいため、サーバー側のログは `lib/server/logger.ts`（log4j2風のロガー）で出力し、Supabaseの `app_logs` テーブルにも保存します。Vercelのログにも従来どおり出力されます。

## 構成

| log4j2                   | 本アプリ                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Logger                   | `getLogger("stripe.webhook")`。名前は `.` 区切りの階層（例: `api.share.settings`）      |
| Level                    | `TRACE` < `DEBUG` < `INFO` < `WARN` < `ERROR` < `FATAL`                                 |
| Appender                 | コンソール（Vercelログ）とデータベース（`app_logs`）                                    |
| ThreadContext (MDC)      | `putContext({ userId })` で以降のログへ自動付与。`requestId` は `withRequestLog` が付与 |
| DeleteAction（保持期間） | Cron（Cloudflare Worker → `/api/cron/deadline-notify`）が毎日 `purge_app_logs()` を実行 |

## 使い方

APIルートは `withRequestLog` で包みます。`requestId`（`x-vercel-id`）の付与、終了ログ（ステータス・所要時間）、未捕捉例外の記録、終了時のDB書き込み完了待ち（flush）を自動で行います。

```ts
import { getLogger, putContext, withRequestLog } from "@/lib/server/logger";

const log = getLogger("api.example");

export const POST = withRequestLog("api.example", async (request: NextRequest) => {
  const user = await getUserFromRequest(request, admin);
  putContext({ userId: user.id });          // 以降のログに userId が付く
  log.info("something happened", { count: 3 });
  log.error("failed", error);               // Error を渡すとスタックも記録される
  return NextResponse.json({ ok: true });
});
```

- 2つ目の引数に `Error` を渡すと `context.error`、それ以外は `context.data` に記録されます。
- 死活監視・画像配信など高頻度のルートは `{ quiet: true }` を渡すと、正常終了のログが `DEBUG` になります（異常時は `WARN` / `ERROR`）。
- Server Component（ページ描画）やルート外の処理は、ログ出力後に `await flushLogs()` を呼んでください（呼ばないと、関数終了後にDBへ書き込まれない場合があります）。
- Edgeランタイム（`middleware.ts`）では使えません（`node:async_hooks` を使用しているため）。
- ブラウザ側（`components/`、`hooks/`、`app/**/page.tsx` の Client Component）の `console.*` は対象外です。

## 環境変数

| 変数             | 既定値                   | 内容                                                               |
| ---------------- | ------------------------ | ------------------------------------------------------------------ |
| `LOG_LEVEL`      | 本番 `INFO` / 他 `DEBUG` | 全体の最低レベル                                                   |
| `LOG_LEVELS`     | なし                     | ロガー名ごとの上書き。例: `stripe=WARN,cron.deadline-notify=DEBUG` |
| `LOG_DB_LEVEL`   | `INFO`                   | `app_logs` に保存する最低レベル。保存量を減らすなら `WARN`         |
| `LOG_DB_ENABLED` | 有効                     | `false` で `app_logs` への保存を無効化（コンソール出力のみ）       |

ロガー名の指定は前方一致で、長い名前が優先されます（`stripe` は `stripe.webhook` にも適用）。変更後は Redeploy してください。

## 保存先（`app_logs`）

- migration: `supabase/migrations/20261024000000_V2.0.0_app_logs.sql`（[DB運用ガイド](./database-operations.md)の手順で適用）
- `service_role` 専用です。クライアント（`anon` / `authenticated`）からは読み書きできません。
- 主な列: `logged_at` / `level` / `level_value` / `logger` / `message` / `context`(jsonb) / `request_id`
- 保持期間: `INFO` 以下は14日、`WARN` 以上は90日（`app/api/cron/deadline-notify/route.ts` の `LOG_RETENTION_*_DAYS`）。変更時はこのガイドも更新してください。
- 削除はCloudflare Worker経由のCron（本番URLのみ）が実行するため、Preview環境のログは自動削除されません。Cronが止まるとログも削除されなくなります（[Cloudflare Cron 運用ガイド](./cloudflare-cron.md)）。

## 調べ方（Supabase SQL Editor）

```sql
-- 直近のエラー
select logged_at, logger, message, context
from public.app_logs
where level_value >= 50
order by logged_at desc
limit 50;

-- 1リクエストの流れを追う（request_id は Vercel の x-vercel-id）
select logged_at, level, logger, message, context
from public.app_logs
where request_id = '<request_id>'
order by id;

-- 特定ユーザーの操作履歴
select logged_at, level, logger, message
from public.app_logs
where context->>'userId' = '<user_id>'
order by logged_at desc
limit 100;

-- Stripe Webhookの失敗
select logged_at, message, context
from public.app_logs
where logger = 'stripe.webhook' and level_value >= 40
order by logged_at desc;

-- ログ量の確認（レベル別）
select level, count(*) from public.app_logs group by level order by 1;
```

## 記録してはいけない情報

- パスワード、トークン、APIキー、署名、Cookie、購読情報（`endpoint` / 暗号鍵）、共有リンクのトークン。キー名に `password` / `token` / `secret` / `authorization` / `cookie` / `api_key` / `signature` / `credential` / `subscription` を含む値は、自動で `[REDACTED]` になります。ただし、本文などの文字列の中身までは判定できないため、機密情報をメッセージ文に含めないでください。
- お問い合わせの氏名・メールアドレス・本文、アカウント削除時のメールアドレスなどの個人情報。ユーザーの特定には `userId` を使います。
- ログの内容は[プライバシーポリシー](../app/privacy/page.tsx)にも記載しています。記録する情報の種類や保持期間を変えるときは、あわせて更新してください。

## 容量・運用の目安

- `INFO` ではAPI1リクエストにつき1行程度が保存されます。Supabaseの容量が気になる場合は `LOG_DB_LEVEL=WARN` にするか、高頻度ルートに `quiet` を指定してください。
- ログ保存の失敗（テーブル未作成など）は、本処理を止めずにコンソールへ `logger: failed to persist logs` と出力します。Vercelのログで確認してください。
- 異常の「通知」は引き続き `lib/server/monitor.ts`（管理者メール・Healthchecks.io）が担当し、`app_logs` は原因調査用の記録です。
