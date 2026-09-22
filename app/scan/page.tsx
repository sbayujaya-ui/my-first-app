import { requirePermission } from "../../lib/auth/authService";
import ScanPageClient from "./ScanPageClient";

export default async function ScanPage() {
  const profile = await requirePermission("scan");

  if (!profile) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk menggunakan scanner.
        </p>
      </main>
    );
  }

  return <ScanPageClient />;
}
