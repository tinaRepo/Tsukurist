import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { accountDeletedEmail, getNoReplyFrom } from "@/lib/email-templates";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, createAdminClient, getUserFromRequest } from "@/lib/server/admin";
import { deleteUserCompletely } from "@/lib/server/delete-account";
import { getLogger, putContext, withRequestLog } from "@/lib/server/logger";

const log = getLogger("api.account.delete");

// Google専用ユーザーなど、パスワードで本人確認できない場合に許容する「直近のログイン」の時間
const RECENT_LOGIN_MS = 15 * 60 * 1000;

// 本人によるアカウント削除（即時）
//   本人確認: ① 登録メールアドレスの入力 ② パスワード設定済みならパスワード、
//   Google専用ユーザーなら直近15分以内のログイン
//   管理者アカウントは締め出し防止のため、この経路では削除できない。
// 監査のため、削除の成功・失敗・本人確認の失敗は app_logs に残す（メールアドレスは記録しない）
export const POST = withRequestLog("api.account.delete", async (request: NextRequest) => {
  try {
    const admin = createAdminClient();
    const user = await getUserFromRequest(request, admin);
    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    putContext({ userId: user.id });

    const rl = await checkRateLimit(admin, `account-delete:${user.id}`, 5, 86400);
    if (rl === "error") return NextResponse.json({ error: "現在処理できません。しばらくしてからお試しください。" }, { status: 503 });
    if (rl === "limited") return NextResponse.json({ error: "試行回数が上限に達しました。時間をおいてお試しください。" }, { status: 429 });

    const payload = await request.json().catch(() => ({}));
    const confirmEmail = typeof payload?.confirmEmail === "string" ? payload.confirmEmail.trim().toLowerCase() : "";
    const password = typeof payload?.password === "string" ? payload.password : "";

    if (confirmEmail !== user.email.toLowerCase()) {
      log.warn("account deletion rejected: email mismatch");
      return NextResponse.json({ error: "メールアドレスが一致しません" }, { status: 400 });
    }

    const { data: profile } = await admin
      .from("user_profiles").select("is_admin, has_password").eq("id", user.id).single();
    if (profile?.is_admin) {
      log.warn("account deletion rejected: admin account");
      return NextResponse.json({ error: "管理者アカウントはこの画面から削除できません" }, { status: 403 });
    }

    if (profile?.has_password) {
      if (!password) return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
      const anon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { error: pwErr } = await anon.auth.signInWithPassword({ email: user.email, password });
      if (pwErr) {
        log.warn("account deletion rejected: wrong password");
        return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 403 });
      }
    } else {
      const last = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
      if (Date.now() - last > RECENT_LOGIN_MS) {
        log.warn("account deletion rejected: reauthentication required");
        return NextResponse.json({ error: "reauth_required" }, { status: 403 });
      }
    }

    log.info("account deletion started");
    const result = await deleteUserCompletely(admin, user.id);
    if (!result.ok) {
      log.error("account delete failed", { stage: result.stage, error: result.error });
      return NextResponse.json(
        { error: "削除を完了できませんでした。時間をおいて再度お試しください。解決しない場合はお問い合わせください。" },
        { status: result.stage === "auth" ? 500 : 502 }
      );
    }
    log.info("account deleted");

    // 完了メール（失敗しても削除自体は完了している）
    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: getNoReplyFrom(),
          to: user.email,
          ...accountDeletedEmail(),
        });
      }
    } catch (e) {
      log.warn("goodbye email failed", e);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("ct_last_login_provider", "", {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (e: any) {
    log.error("account delete error", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
});
