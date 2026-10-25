import { getPublicShareData } from "@/lib/server/public-share";
import { getLogger, withRequestLog } from "@/lib/server/logger";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const log = getLogger("api.public-share");

const NO_CACHE = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

// 公開ページの閲覧は高頻度になり得るため、正常時の終了ログは DEBUG（quiet）。
// ※ 共有トークンはログに残さない（リンクを知る人が閲覧できるため、秘密情報として扱う）
export const GET = withRequestLog(
  "api.public-share",
  async (_request: NextRequest, { params }: { params: { token: string } }) => {
    try {
      const data = await getPublicShareData(params.token);
      if (!data) {
        return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_CACHE });
      }
      return NextResponse.json(data, { headers: NO_CACHE });
    } catch (error) {
      log.error("public share GET failed", error);
      return NextResponse.json({ error: "unavailable" }, { status: 500, headers: NO_CACHE });
    }
  },
  { quiet: true }
);
