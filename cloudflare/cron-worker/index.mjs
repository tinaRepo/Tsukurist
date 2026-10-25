// ============================================================
// Cloudflare Workers Cron Trigger → Vercel の Cron ルートを呼び出す
// ------------------------------------------------------------
// 毎日 23:00 UTC（= 日本時間 8:00）に、/api/cron/deadline-notify を
// Authorization: Bearer <CRON_SECRET> 付きで GET する。処理本体は Vercel 側（app/api/cron/deadline-notify/route.ts）。
// 本番(production)と検証(staging)は別々のWorkerとしてデプロイし、設定・secretを完全に分ける（wrangler.toml の [env.*]）。
//
//   ENVIRONMENT                     : "production" / "staging"（ログ用。wrangler.toml の [vars]）
//   TARGET_URL                      : 呼び出すURL（wrangler.toml の [vars]。その環境の正規URLを指定する）
//   CRON_SECRET                     : その環境のVercelの CRON_SECRET と同じ値（wrangler secret put CRON_SECRET --env <環境>）
//   VERCEL_PROTECTION_BYPASS_SECRET : 任意。Vercel Deployment Protection が有効な検証環境用（x-vercel-protection-bypass）
//   HEALTHCHECKS_PING_URL           : 任意。最終的に失敗したときに /fail へ通知する（環境ごとに別のチェックを使う）
//
// リトライ: ネットワークエラー・タイムアウト・5xx・429 のみ最大3回（待機 0s → 5s → 20s）。
//   401/403/404 などの4xxは設定ミスのため、リトライせず即失敗にする。
// 注意: 通知は notification_log で「1日1ユーザー1回」に制限されるため、リトライで二重送信されることはない。
// ============================================================

const ATTEMPTS = 3;
const BACKOFF_MS = [0, 5_000, 20_000];
const TIMEOUT_MS = 65_000; // Vercel側の maxDuration(60秒) より少し長く待つ

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let environment = "unknown";
const log = (level, message, extra = {}) =>
  console[level === "error" ? "error" : "log"](JSON.stringify({ level, environment, message, ...extra }));

export default {
  async scheduled(event, env) {
    environment = env.ENVIRONMENT ?? "unknown";
    await run(event, env);
  },
};

// 設定の検証。URLが不正・プレースホルダーのままなら、リクエストを送らずに失敗させる
function validateConfig(env) {
  if (!env.TARGET_URL || !env.CRON_SECRET) return "TARGET_URL or CRON_SECRET is not configured";
  if (env.TARGET_URL.includes("REPLACE-WITH")) return "TARGET_URL is still a placeholder (edit wrangler.toml)";
  let url;
  try {
    url = new URL(env.TARGET_URL);
  } catch {
    return "TARGET_URL is not a valid URL";
  }
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !isLocal) return "TARGET_URL must be https";
  return null;
}

async function run(event, env) {
  const configError = validateConfig(env);
  if (configError) {
    log("error", configError);
    await pingFail(env);
    throw new Error(configError);
  }

  const headers = {
    Authorization: `Bearer ${env.CRON_SECRET}`,
    "User-Agent": "tsukurist-cron-worker/1.0",
    "X-Cron-Source": "cloudflare-workers",
  };
  // Vercel Deployment Protection（検証環境のPreview保護）を通すための任意ヘッダー
  if (env.VERCEL_PROTECTION_BYPASS_SECRET) headers["x-vercel-protection-bypass"] = env.VERCEL_PROTECTION_BYPASS_SECRET;

  let lastError = "unknown";
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1] > 0) await sleep(BACKOFF_MS[attempt - 1]);

    const started = Date.now();
    try {
      const res = await fetch(env.TARGET_URL, {
        method: "GET",
        headers,
        // リダイレクト先へ認証ヘッダーが渡らないよう手動で扱う（TARGET_URLは正規URLにすること）
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const durationMs = Date.now() - started;

      if (res.ok) {
        log("info", "cron request succeeded", { attempt, status: res.status, durationMs, cron: event.cron });
        return;
      }

      lastError = `HTTP ${res.status}`;
      const retryable = res.status >= 500 || res.status === 429;
      // Vercel Deployment Protection の認証ページは _vercel_sso_nonce Cookie を返す
      const protectedByVercel = res.status === 401 && (res.headers.get("set-cookie") ?? "").includes("_vercel_sso_nonce");
      log(retryable ? "warn" : "error", "cron request failed", {
        attempt, status: res.status, durationMs, retryable,
        ...(protectedByVercel ? { hint: "Vercel Deployment Protection is blocking the request. Set VERCEL_PROTECTION_BYPASS_SECRET." } : {}),
      });
      if (!retryable) break; // 401/403/404/3xx など: 設定を直さない限り直らない
    } catch (e) {
      lastError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      log("warn", "cron request error", { attempt, error: lastError });
    }
  }

  await pingFail(env);
  throw new Error(`deadline-notify cron failed (${environment}): ${lastError}`);
}

// 失敗時のみ Healthchecks.io へ通知（成功のpingは Vercel 側のルートが送る）
async function pingFail(env) {
  const base = env.HEALTHCHECKS_PING_URL;
  if (!base) return;
  try {
    await fetch(`${base.replace(/\/$/, "")}/fail`, { signal: AbortSignal.timeout(5_000) });
  } catch (e) {
    log("warn", "healthchecks fail ping failed", { error: String(e) });
  }
}
