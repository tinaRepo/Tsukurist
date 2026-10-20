import { noIndexMetadata } from "@/lib/seo";

export const metadata = { ...noIndexMetadata, title: "料金プラン | ツクリスト" };

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
