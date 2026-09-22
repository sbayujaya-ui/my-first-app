import { requirePermission } from "../../lib/auth/authService";
import LaporanPageClient from "./LaporanPageClient";

export default async function LaporanPage() {
  const profile = await requirePermission("laporan.riwayat");

  if (!profile) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk melihat riwayat laporan.
        </p>
      </main>
    );
  }

  return <LaporanPageClient />;
}
