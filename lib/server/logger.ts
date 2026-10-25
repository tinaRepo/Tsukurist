import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

// ============================================================
// log4j2 風のサーバー用ロガー（Node.js ランタイム専用。middleware(Edge)からは使わない）
// ------------------------------------------------------------
//   Logger    : getLogger("stripe.webhook") のように名前付きで取得（階層は "." 区切り）
//   Level     : TRACE < DEBUG < INFO < WARN < ERROR < FATAL
//   Appender  : Console（Vercelログにも残る）+ Database（Supabase app_logs。永続・検索可能）
//   MDC       : runWithContext() / putContext() で requestId などを全ログに自動付与（ThreadContext相当）
//   Retention : app_logs の古い行は Cron が purge_app_logs() で削除（log4j2のDeleteAction相当）
//
// 環境変数:
//   LOG_LEVEL       全体の最低レベル（既定: production=INFO / その他=DEBUG）
//   LOG_LEVELS      ロガー名ごとの上書き。例: "stripe=WARN,cron.deadline-notify=DEBUG"（前方一致・長い方が優先）
//   LOG_DB_LEVEL    DBに保存する最低レベル（既定: INFO）
//   LOG_DB_ENABLED  "false" でDB保存を無効化（既定: 有効）
//
// ※ このファイルは lib/server/admin.ts から import されるため、admin.ts を import しない（循環参照防止）。
// ※ サーバーレスでは関数の終了後に非同期処理が止まるため、APIルートは withRequestLog() で包むか、
//   終了前に await flushLogs() を呼ぶこと。
// ============================================================

export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

const LEVEL_VALUE: Record<LogLevel, number> = {
  TRACE: 10, DEBUG: 20, INFO: 30, WARN: 40, ERROR: 50, FATAL: 60,
};

type Context = Record<string, unknown>;

type LogEntry = {
  logged_at: string;
  level: LogLevel;
  level_value: number;
  logger: string;
  message: string;
  context: Context | null;
  request_id: string | null;
};

// ---------------- 設定 ----------------

function parseLevel(raw: string | undefined, fallback: LogLevel): LogLevel {
  const v = raw?.trim().toUpperCase();
  return v && v in LEVEL_VALUE ? (v as LogLevel) : fallback;
}

type Config = {
  root: LogLevel;
  overrides: [string, LogLevel][];
  dbLevel: LogLevel;
  dbEnabled: boolean;
};

let cachedConfig: Config | null = null;

function config(): Config {
  if (cachedConfig) return cachedConfig;
  const overrides = (process.env.LOG_LEVELS ?? "")
    .split(",")
    .map(pair => pair.split("="))
    .filter(([name, level]) => name?.trim() && level?.trim())
    .map(([name, level]) => [name.trim(), parseLevel(level, "INFO")] as [string, LogLevel])
    .sort((a, b) => b[0].length - a[0].length); // 長い名前を優先
  cachedConfig = {
    root: parseLevel(process.env.LOG_LEVEL, process.env.NODE_ENV === "production" ? "INFO" : "DEBUG"),
    overrides,
    dbLevel: parseLevel(process.env.LOG_DB_LEVEL, "INFO"),
    dbEnabled: process.env.LOG_DB_ENABLED !== "false"
      && !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  return cachedConfig;
}

function effectiveLevel(name: string): LogLevel {
  const { overrides, root } = config();
  for (const [prefix, level] of overrides) {
    if (name === prefix || name.startsWith(`${prefix}.`)) return level;
  }
  return root;
}

// ---------------- MDC（リクエスト単位のコンテキスト） ----------------

const mdc = new AsyncLocalStorage<Context>();

export function runWithContext<T>(values: Context, fn: () => T): T {
  return mdc.run({ ...(mdc.getStore() ?? {}), ...values }, fn);
}

// 現在のリクエストのコンテキストに値を足す（例: putContext({ userId })）
export function putContext(values: Context): void {
  const store = mdc.getStore();
  if (store) Object.assign(store, values);
}

// ---------------- マスキング・整形 ----------------

const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie|api[-_]?key|signature|credential|subscription/i;
const MAX_STRING = 2000;
const MAX_DEPTH = 4;

function sanitize(value: unknown, depth = 0): unknown {
  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…(truncated)` : value;
  if (value instanceof Error) return serializeError(value);
  if (depth >= MAX_DEPTH) return "[MaxDepth]";
  if (Array.isArray(value)) return value.slice(0, 50).map(v => sanitize(v, depth + 1));
  if (typeof value === "object") {
    const out: Context = {};
    for (const [k, v] of Object.entries(value as Context)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[REDACTED]" : sanitize(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

function serializeError(e: Error & { code?: unknown; statusCode?: unknown }) {
  return {
    name: e.name, message: e.message, code: e.code, statusCode: e.statusCode,
    stack: e.stack?.slice(0, 4000),
  };
}

// log4j2 の PatternLayout 風: "%d %-5p [%X{requestId}] %c - %m %X"
function formatPattern(e: LogEntry): string {
  const ctx = e.context && Object.keys(e.context).length > 0 ? ` ${JSON.stringify(e.context)}` : "";
  const req = e.request_id ? `[${e.request_id.slice(0, 12)}] ` : "";
  return `${e.logged_at} ${e.level.padEnd(5)} ${req}${e.logger} - ${e.message}${ctx}`;
}

// ---------------- Appender ----------------

function consoleAppend(e: LogEntry) {
  const line = formatPattern(e);
  if (e.level_value >= LEVEL_VALUE.ERROR) console.error(line);
  else if (e.level_value >= LEVEL_VALUE.WARN) console.warn(line);
  else console.log(line);
}

let dbClient: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!dbClient) {
    dbClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
      }
    );
  }
  return dbClient;
}

const buffer: LogEntry[] = [];
const inflight = new Set<Promise<void>>();
let scheduled = false;

// 同じtick内のログを1回のINSERTにまとめる（バッチ）
function scheduleFlush() {
  if (scheduled) return;
  scheduled = true;
  const p: Promise<void> = Promise.resolve().then(writeBuffer).finally(() => inflight.delete(p));
  inflight.add(p);
}

async function writeBuffer() {
  scheduled = false;
  if (buffer.length === 0) return;
  const rows = buffer.splice(0, buffer.length);
  try {
    const { error } = await db().from("app_logs").insert(rows);
    if (error) throw error;
  } catch (err) {
    // ログ保存の失敗で本処理を止めない。無限ループを避けるため console のみ
    console.error("logger: failed to persist logs to app_logs:", (err as Error)?.message ?? err);
  }
}

// 関数終了前に必ず呼ぶ（未保存のログをDBへ書き切る）
export async function flushLogs(): Promise<void> {
  if (buffer.length > 0) scheduleFlush();
  while (inflight.size > 0) await Promise.all(Array.from(inflight));
}

// ---------------- Logger ----------------

export class Logger {
  constructor(readonly name: string) { }

  isEnabled(level: LogLevel): boolean {
    return LEVEL_VALUE[level] >= LEVEL_VALUE[effectiveLevel(this.name)];
  }

  // data: Error なら error 情報として、それ以外は context.data として記録する
  private log(level: LogLevel, message: string, data?: unknown) {
    if (!this.isEnabled(level)) return;

    const { requestId, ...mdcRest } = (mdc.getStore() ?? {}) as Context & { requestId?: string };
    const context: Context = { ...mdcRest };
    if (data instanceof Error) context.error = serializeError(data);
    else if (data !== undefined) context.data = data;
    const clean = sanitize(context) as Context;

    const entry: LogEntry = {
      logged_at: new Date().toISOString(),
      level,
      level_value: LEVEL_VALUE[level],
      logger: this.name,
      message: message.slice(0, 4000),
      context: Object.keys(clean).length > 0 ? clean : null,
      request_id: typeof requestId === "string" ? requestId : null,
    };

    consoleAppend(entry);

    const cfg = config();
    if (cfg.dbEnabled && LEVEL_VALUE[level] >= LEVEL_VALUE[cfg.dbLevel]) {
      buffer.push(entry);
      scheduleFlush();
    }
  }

  trace(message: string, data?: unknown) { this.log("TRACE", message, data); }
  debug(message: string, data?: unknown) { this.log("DEBUG", message, data); }
  info(message: string, data?: unknown) { this.log("INFO", message, data); }
  warn(message: string, data?: unknown) { this.log("WARN", message, data); }
  error(message: string, data?: unknown) { this.log("ERROR", message, data); }
  fatal(message: string, data?: unknown) { this.log("FATAL", message, data); }
}

const loggers = new Map<string, Logger>();

export function getLogger(name: string): Logger {
  let logger = loggers.get(name);
  if (!logger) {
    logger = new Logger(name);
    loggers.set(name, logger);
  }
  return logger;
}

// ---------------- APIルート用ラッパー ----------------
// requestId の付与、終了ログ（ステータス・所要時間）、未捕捉例外の記録、終了時のflushを行う。
//   export const POST = withRequestLog("stripe.webhook", async (request) => { ... });
// quiet: true は、2xx/3xxの終了ログを DEBUG にする（死活監視・画像配信など高頻度のルート用）。
export function withRequestLog<A extends unknown[]>(
  name: string,
  handler: (request: NextRequest, ...args: A) => Promise<Response>,
  options: { quiet?: boolean } = {}
) {
  return async (request: NextRequest, ...args: A): Promise<Response> => {
    const log = getLogger(name);
    const requestId = request.headers.get("x-vercel-id") ?? randomUUID();
    return runWithContext(
      { requestId, method: request.method, path: request.nextUrl.pathname },
      async () => {
        const started = Date.now();
        try {
          const res = await handler(request, ...args);
          const durationMs = Date.now() - started;
          const level = res.status >= 500 ? "error"
            : res.status >= 400 ? "warn"
              : options.quiet ? "debug" : "info";
          log[level]("request completed", { status: res.status, durationMs });
          return res;
        } catch (e) {
          log.fatal("unhandled exception", e);
          throw e;
        } finally {
          await flushLogs();
        }
      }
    );
  };
}
