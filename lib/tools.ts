// 無料ツールの一覧（ハブ・サイトマップ・関連ツール表示で共通利用）
export type ToolInfo = {
  slug: string;
  title: string;       // h1・<title>
  summary: string;     // 一覧カード用
  description: string; // meta description
};

export const TOOLS: ToolInfo[] = [
  {
    slug: "deadline-calculator",
    title: "納期逆算カレンダー：依頼を出す最終日がわかる",
    summary: "納期から逆算して、各工程の開始日・終了日を出す",
    description: "納期と工程の日数を入れるだけで、各工程の開始日と終了日、依頼を出す最終日を逆算できる無料ツール。土日を除く計算や余裕日数にも対応。登録不要です。",
  },
  {
    slug: "outsourcing-cost",
    title: "外注費の見積もり計算：消費税・源泉徴収・特急料金",
    summary: "項目ごとの金額から、税込・源泉徴収後の支払額を計算",
    description: "外注費の項目と金額を入れると、特急料金・消費税・源泉徴収を含めた支払総額を計算できる無料ツール。作業時間から時給換算も確認できます。登録不要です。",
  },
  {
    slug: "request-template",
    title: "依頼書テンプレート作成：仕様・納期・修正回数を整理",
    summary: "依頼内容を入力して、依頼書の文面を作成・コピー・保存",
    description: "件名・仕様・納期・金額・修正回数・利用範囲を入力するだけで、外注・制作依頼の依頼書の文面を作成できる無料ツール。コピーとテキスト保存に対応。登録不要です。",
  },
];

export const getTool = (slug: string) => TOOLS.find(t => t.slug === slug);
