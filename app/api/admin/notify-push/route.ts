import webpush from "web-push";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient, getAdminFromRequest } from "@/lib/server/admin";
import { getLogger, putContext, withRequestLog } from "@/lib/server/logger";

const log = getLogger("api.admin.notify-push");

// お知らせ・バージョン情報の新規作成時に、対象ユーザーの購読者へプッシュ通知を送るAPI
// （1ユーザーが複数端末で購読している場合は、すべての端末に送る）
export const POST = withRequestLog("api.admin.notify-push", async (request: NextRequest) => {
    try {
        const adminSupabase = createAdminClient();
        const auth = await getAdminFromRequest(request, adminSupabase);
        if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
        putContext({ adminId: auth.user.id });

        const { title, body, targetPlans, targetUserIds } = await request.json();
        if (!title || !body || typeof title !== "string" || typeof body !== "string") {
            return NextResponse.json({ error: "title/bodyが必要です" }, { status: 400 });
        }
        if (title.length > 200 || body.length > 1000) {
            return NextResponse.json({ error: "title/bodyが長すぎます" }, { status: 400 });
        }

        webpush.setVapidDetails(
            process.env.VAPID_EMAIL!,
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
        );

        // ── 対象ユーザーの絞り込み ──
        // targetUserIds指定 > targetPlans指定 > どちらも無ければ全員
        let targetUserIdList: string[] | null = null;
        if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
            targetUserIdList = targetUserIds;
        } else if (Array.isArray(targetPlans) && targetPlans.length > 0) {
            const { data: profs } = await adminSupabase
                .from("user_profiles").select("id").in("plan", targetPlans);
            targetUserIdList = (profs ?? []).map((p) => p.id);
        }

        let query = adminSupabase.from("push_subscriptions").select("user_id, endpoint, subscription");
        if (targetUserIdList) query = query.in("user_id", targetUserIdList);
        const { data: subs } = await query;

        if (!subs || subs.length === 0) {
            log.info("no subscribers for broadcast", { title });
            return NextResponse.json({ sent: 0, failed: 0 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
        const payload = JSON.stringify({ title, body, url: appUrl });
        let sent = 0, failed = 0;

        for (const sub of subs) {
            try {
                await webpush.sendNotification(sub.subscription, payload);
                sent++;
            } catch (e: any) {
                failed++;
                log.warn("push failed", { userId: sub.user_id, statusCode: e.statusCode, message: e.message });
                // 失効した購読（404/410）は、その端末の分だけ削除する（他の端末は残す）
                if (e.statusCode === 410 || e.statusCode === 404) {
                    await adminSupabase
                        .from("push_subscriptions")
                        .delete()
                        .eq("user_id", sub.user_id)
                        .eq("endpoint", sub.endpoint);
                }
            }
        }

        log.info("broadcast sent", { title, sent, failed, targeted: targetUserIdList ? targetUserIdList.length : "all" });
        return NextResponse.json({ sent, failed });
    } catch (e: any) {
        log.error("notify-push error", e);
        return NextResponse.json({ error: "エラーが発生しました" }, { status: 500 });
    }
});
