// 納期通知まわりの定数と判定ロジック（副作用なし。ブラウザ・サーバーの両方から使える）
// ※ 値の範囲は DB の check 制約（20261027000000_V2.1.0_...sql）と同じ。変更時は両方更新すること

export const NOTIFY_DAYS_MAX = 30;

// 全体設定で選べる「納期の何日前」（0 = 当日）
export const NOTIFY_DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 14] as const;

// 既定値（従来の「7日以内は毎日」と同じ）。DBの default と同じ値
export const DEFAULT_NOTIFY_DAYS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7];

// タスク個別リマインドで選べる「納期の何日前」
export const TASK_REMIND_OPTIONS = [0, 1, 2, 3, 5, 7, 14, 30] as const;

export const formatDaysBefore = (n: number) => (n === 0 ? "当日" : `${n}日前`);

// DBから読んだ値を安全な配列にそろえる（範囲外・重複を除き昇順）。空配列は「通知しない」として保持する
export function normalizeNotifyDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [...DEFAULT_NOTIFY_DAYS];
  const days = value.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= NOTIFY_DAYS_MAX);
  return Array.from(new Set(days)).sort((a, b) => a - b);
}

// 納期までの残り日数 daysLeft のタスクを、今日通知するか
export function shouldNotify(
  daysLeft: number,
  notifyDays: readonly number[],
  remindBefore: number | null | undefined,
): boolean {
  return notifyDays.includes(daysLeft) || (remindBefore != null && remindBefore === daysLeft);
}
