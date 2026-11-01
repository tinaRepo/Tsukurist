-- ============================================================
-- Migration: 納期通知の粒度設定・タスク個別リマインダー
-- version: 2.0.1
-- 内容:
--   1. user_settings.notify_days : 納期の「何日前」に通知するか（0=当日。既定は従来どおり0〜7日前）
--   2. tasks.remind_before_days  : このタスクだけの追加リマインド（納期の何日前か。null=なし）
-- 備考:
--   - 値の範囲(0〜30)は lib/notify.ts の NOTIFY_DAYS_MAX と同じ。変更時は両方更新すること
--   - 既存テーブルへの列追加のため、RLS・GRANTの変更は不要
-- ============================================================

alter table public.user_settings
  add column if not exists notify_days integer[] not null
    default array[0,1,2,3,4,5,6,7]
    check (
      notify_days <@ array[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]
      and cardinality(notify_days) <= 31
    );

alter table public.tasks
  add column if not exists remind_before_days smallint
    check (remind_before_days between 0 and 30);

-- 確認クエリ
-- select user_id, notify_hour, notify_days from public.user_settings limit 10;
-- select id, title, deadline, remind_before_days from public.tasks where remind_before_days is not null;
