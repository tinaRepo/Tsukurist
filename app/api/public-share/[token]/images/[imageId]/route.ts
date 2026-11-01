import { createAdminClient } from "@/lib/server/admin";
import { getLogger, withRequestLog } from "@/lib/server/logger";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const log = getLogger("api.public-share.image");

const NO_CACHE = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

// 画像配信は高頻度になり得るため、正常時の終了ログは DEBUG（quiet）。共有トークンはログに残さない。
export const GET = withRequestLog(
  "api.public-share.image",
  async (_request: NextRequest, { params }: { params: { token: string; imageId: string } }) => {
    const { token, imageId } = params;
    if (!/^[A-Za-z0-9_-]{40,50}$/.test(token) || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(imageId)) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_CACHE });
    }

    const admin = createAdminClient();

    try {
      const { data: settings, error: settingsError } = await admin
        .from("public_share_pages")
        .select("user_id, enabled, show_portfolio")
        .eq("share_token", token)
        .maybeSingle();
      if (settingsError) throw settingsError;
      if (!settings?.enabled || !settings.show_portfolio) {
        return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_CACHE });
      }

      const [profileResult, selectedImageResult, imageResult] = await Promise.all([
        admin
          .from("user_profiles")
          .select("plan")
          .eq("id", settings.user_id)
          .maybeSingle(),
        admin
          .from("public_share_gallery")
          .select("image_id")
          .eq("user_id", settings.user_id)
          .eq("image_id", imageId)
          .maybeSingle(),
        admin
          .from("task_images")
          .select("storage_path, tasks!inner(user_id)")
          .eq("id", imageId)
          .eq("tasks.user_id", settings.user_id)
          .maybeSingle(),
      ]);
      const { data: profile, error: profileError } = profileResult;
      if (profileError) throw profileError;
      if (profile?.plan !== "premium") {
        return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_CACHE });
      }

      const { data: selectedImage, error: selectedImageError } = selectedImageResult;
      if (selectedImageError) throw selectedImageError;
      if (!selectedImage) {
        return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_CACHE });
      }

      const { data: image, error: imageError } = imageResult;
      if (imageError) throw imageError;
      if (!image) {
        return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_CACHE });
      }

      const { data: file, error: fileError } = await admin.storage
        .from("task-images")
        .download(image.storage_path);
      if (fileError) throw fileError;
      return new NextResponse(await file.arrayBuffer(), {
        headers: {
          ...NO_CACHE,
          "Content-Type": file.type || "application/octet-stream",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      log.error("public share image GET failed", error);
      return NextResponse.json({ error: "unavailable" }, { status: 500, headers: NO_CACHE });
    }
  },
  { quiet: true }
);
