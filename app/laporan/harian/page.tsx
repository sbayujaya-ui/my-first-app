import { requirePermission } from "../../../lib/auth/authService";
import LaporanHarianPageClient from "./LaporanHarianPageClient";

export default async function LaporanHarianPage() {
  const profile = await requirePermission("laporan.harian");

  if (!profile) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk melihat laporan harian.
        </p>
      </main>
    );
  }

  return <LaporanHarianPageClient />;
}
