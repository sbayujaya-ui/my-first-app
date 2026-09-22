import { requirePermission } from "../../lib/auth/authService";
import PenjualanPageClient from "./PenjualanPageClient";

export default async function PenjualanPage() {
  const profile = await requirePermission("penjualan");

  if (!profile) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk mengakses halaman penjualan.
        </p>
      </main>
    );
  }

  return <PenjualanPageClient />;
}
