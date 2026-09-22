import { requirePermission } from "../lib/auth/authService";
import DashboardPageClient from "./DashboardPageClient";

export default async function DashboardPage() {
  const profile = await requirePermission("dashboard");

  if (!profile) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk mengakses dashboard.
        </p>
      </main>
    );
  }

  return <DashboardPageClient />;
}
