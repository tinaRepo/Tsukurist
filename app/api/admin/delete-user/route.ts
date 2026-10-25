import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteUserCompletely } from "@/lib/server/delete-account";
import { createAdminClient, getAdminFromRequest } from "@/lib/server/admin";
import { getLogger, putContext, withRequestLog } from "@/lib/server/logger";

const log = getLogger("api.admin.delete-user");

// 管理者によるユーザー削除。監査のため、実行者と対象を app_logs に残す
export const POST = withRequestLog("api.admin.delete-user", async (request: NextRequest) => {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const auth = await getAdminFromRequest(request, adminSupabase);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const caller = auth.user;
    putContext({ adminId: caller.id, targetUserId: userId });

    // 自分自身は削除できない
    if (caller.id === userId) {
      return NextResponse.json({ error: "自分自身は削除できません" }, { status: 400 });
    }

    log.info("admin user deletion started");
    const result = await deleteUserCompletely(adminSupabase, userId);
    if (!result.ok) {
      log.error("admin account delete failed", { stage: result.stage, error: result.error });
      return NextResponse.json(
        { error: "削除を完了できませんでした。データベースとStorageの状態を確認してください。" },
        { status: result.stage === "auth" ? 500 : 502 }
      );
    }

    log.info("admin user deletion completed");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    log.error("admin delete-user error", e);
    return NextResponse.json({ error: e.message ?? "削除に失敗しました" }, { status: 500 });
  }
});
