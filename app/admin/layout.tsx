import type { ReactNode } from "react";
import AdminMfaGate from "@/components/AdminMfaGate";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = { ...noIndexMetadata, title: "管理 | ツクリスト" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminMfaGate>{children}</AdminMfaGate>;
}
