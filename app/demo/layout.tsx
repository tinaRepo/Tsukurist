import { noIndexMetadata } from "@/lib/seo";

export const metadata = { ...noIndexMetadata, title: "デモ | ツクリスト" };

export default function DemoLayout({ children }: { children: React.ReactNode }) {
    return children;
}
