-- ============================================================
-- Migration: アプリケーションログの永続化（log4j2風ロガーの保存先）
-- version: 2.0.1
-- 内容:
--   1. app_logs テーブル（service_role 専用。RLS有効・クライアント権限なし）
--   2. 検索用インデックス
--   3. purge_app_logs(): 保持期間を過ぎたログの削除（Cronから呼ぶ）
--        INFO以下 : p_low_days  日（既定14日）
--        WARN以上 : p_high_days 日（既定90日）
-- 前提: lib/server/logger.ts がこのテーブルへINSERTする
-- ============================================================

create table if not exists public.app_logs (
  id          bigint generated always as identity primary key,
  logged_at   timestamptz not null default now(),
  level       text not null
              check (level in ('TRACE','DEBUG','INFO','WARN','ERROR','FATAL')),
  level_value smallint not null,
  logger      text not null,
  message     text not null,
  context     jsonb,
  request_id  text
);

create index if not exists idx_app_logs_logged_at
  on public.app_logs (logged_at desc);
create index if not exists idx_app_logs_level_logged_at
  on public.app_logs (level_value, logged_at desc);
create index if not exists idx_app_logs_request_id
  on public.app_logs (request_id)
  where request_id is not null;
create index if not exists idx_app_logs_logger_logged_at
  on public.app_logs (logger, logged_at desc);

alter table public.app_logs enable row level security;
revoke all on public.app_logs from anon, authenticated;
grant select, insert, delete on public.app_logs to service_role;

create or replace function public.purge_app_logs(
  p_low_days  integer default 14,
  p_high_days integer default 90
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.app_logs
  where (level_value < 40 and logged_at < now() - make_interval(days => p_low_days))
     or (level_value >= 40 and logged_at < now() - make_interval(days => p_high_days));
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.purge_app_logs(integer, integer) from public, anon, authenticated;
grant execute on function public.purge_app_logs(integer, integer) to service_role;

-- ============================================================
-- 確認クエリ
-- ============================================================
-- 直近のエラー
-- select logged_at, logger, message, context from public.app_logs
--  where level_value >= 50 order by logged_at desc limit 50;
--
-- 1リクエストの流れを追う
-- select logged_at, level, logger, message from public.app_logs
--  where request_id = '<x-vercel-id>' order by id;
--
-- ログ件数（レベル別）
-- select level, count(*) from public.app_logs group by level order by 1;
