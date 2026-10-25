import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { GUIDE_PAGES } from "@/lib/guide-pages";
import { TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
    const publicPages = [
        ["/", 1.0],
        ["/guide", 0.7],
        ["/tools", 0.7],
        ["/terms", 0.3],
        ["/privacy", 0.3],
        ["/tokusho", 0.3],
    ] as const;

    return [
        ...publicPages.map(([path, priority]) => ({
            url: `${SITE_URL}${path}`,
            changeFrequency: "monthly" as const,
            priority,
        })),
        ...GUIDE_PAGES.map(p => ({
            url: `${SITE_URL}/guide/${p.slug}`,
            changeFrequency: "monthly" as const,
            priority: 0.6,
        })),
        ...TOOLS.map(t => ({
            url: `${SITE_URL}/tools/${t.slug}`,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        })),
    ];
}
