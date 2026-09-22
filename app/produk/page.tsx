import { requirePermission } from "../../lib/auth/authService";
import ProdukPageClient from "./ProdukPageClient";

export default async function ProdukPage() {
  const profile = await requirePermission("produk.view");

  if (!profile) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk melihat produk.
        </p>
      </main>
    );
  }

  return <ProdukPageClient />;
}
