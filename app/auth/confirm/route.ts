import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getLogger, withRequestLog } from "@/lib/server/logger";

const log = getLogger("auth.confirm");

// GET: パスワード再設定リンクの検証。成功した場合はupdate-passwordページへリダイレクト
export const GET = withRequestLog("auth.confirm", async (request: NextRequest) => {
    const { searchParams, origin } = new URL(request.url);

    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    const providerError = searchParams.get("error");

    if (!token_hash && !code) {
        log.warn("password recovery callback missing code/token_hash", {
            error: providerError,
            errorCode: searchParams.get("error_code"),
            errorDescription: searchParams.get("error_description"),
        });
        return NextResponse.redirect(`${origin}/update-password?error=reset_link_invalid&reason=missing_params`);
    }

    const response = NextResponse.redirect(`${origin}/update-password`);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options as any);
                    });
                },
            },
        }
    );

    // PKCEフロー（メールリンクのtokenがpkce_...形式の場合、Supabaseの検証後にcodeとしてリダイレクトされる）
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            log.warn("password recovery code exchange failed", { code: error.code, message: error.message });
            return NextResponse.redirect(`${origin}/update-password?error=reset_link_invalid&reason=code_exchange_failed`);
        }
        log.info("password recovery link verified (code)");
        return response;
    }

    // token_hashテンプレートではtypeが省略される場合がある。このRouteはrecovery専用。
    const otpType = type || "recovery";
    const { error } = await supabase.auth.verifyOtp({
        token_hash: token_hash!,
        type: otpType as any,
    });
    if (error) {
        log.warn("password recovery token verification failed", { code: error.code, message: error.message });
        return NextResponse.redirect(`${origin}/update-password?error=reset_link_invalid&reason=token_verification_failed`);
    }
    log.info("password recovery link verified (token_hash)");
    return response;
});
