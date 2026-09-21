import { requirePermission } from "../../../lib/auth/authService";
import LaporanBulananPageClient from "./LaporanBulananPageClient";

export default async function LaporanBulananPage() {
  const profile = await requirePermission("laporan.bulanan");

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Akses Ditolak
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Anda tidak memiliki izin untuk membuka laporan bulanan.
          </p>

          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </main>
    );
  }

  return <LaporanBulananPageClient />;
}