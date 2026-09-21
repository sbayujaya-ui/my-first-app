"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import {
  hasPermission,
  type Permission,
  type UserRole,
} from "../../../lib/auth/permissions";

const fiturUtama: Array<{
  judul: string;
  deskripsi: string;
  href: string;
  label: string;
  permission: Permission;
}> = [
  {
    judul: "Produk",
    deskripsi: "Kelola produk, harga, stok, dan margin.",
    href: "/produk",
    label: "Buka Produk",
    permission: "produk.view",
  },
  {
    judul: "Penjualan",
    deskripsi: "Buat transaksi dan kelola keranjang penjualan.",
    href: "/penjualan",
    label: "Buka Penjualan",
    permission: "penjualan",
  },
  {
    judul: "Scan Barcode",
    deskripsi: "Cari produk menggunakan kode atau kamera.",
    href: "/scan",
    label: "Buka Scanner",
    permission: "scan",
  },
];

const fiturLaporan: Array<{
  judul: string;
  deskripsi: string;
  href: string;
  permission: Permission;
}> = [
  {
    judul: "Riwayat Penjualan",
    deskripsi: "Lihat seluruh transaksi yang sudah tersimpan.",
    href: "/laporan",
    permission: "laporan.riwayat",
  },
  {
    judul: "Laporan Harian",
    deskripsi: "Lihat penjualan berdasarkan tanggal.",
    href: "/laporan/harian",
    permission: "laporan.harian",
  },
  {
    judul: "Laporan Bulanan",
    deskripsi: "Lihat rekap penjualan berdasarkan bulan.",
    href: "/laporan/bulanan",
    permission: "laporan.bulanan",
  },
  {
    judul: "Keuntungan",
    deskripsi: "Lihat rekap omzet, modal, dan keuntungan.",
    href: "/laporan/keuntungan",
    permission: "laporan.keuntungan",
  },
];

export default function DashboardFeatureNavigation() {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin" || profile?.role === "kasir") {
        setRole(profile.role);
      }
    }

    loadRole();
  }, []);

  if (!role) {
    return null;
  }

  const fiturUtamaVisible = fiturUtama.filter((fitur) =>
    hasPermission(role, fitur.permission)
  );

  const fiturLaporanVisible = fiturLaporan.filter((fitur) =>
    hasPermission(role, fitur.permission)
  );

  return (
    <section
      className="mt-6 space-y-6"
      data-dashboard-feature-navigation="DASH-004"
    >
      <div>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Pusat Fitur
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Akses Cepat
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Fitur yang tersedia disesuaikan dengan hak akses pengguna.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {fiturUtamaVisible.map((fitur) => (
            <Link
              key={fitur.href}
              href={fitur.href}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md"
            >
              <p className="text-lg font-bold text-slate-900">
                {fitur.judul}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {fitur.deskripsi}
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-blue-700">
                {fitur.label} →
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Laporan
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Pusat Laporan
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Akses laporan sesuai dengan hak akses pengguna.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {fiturLaporanVisible.map((fitur) => (
            <Link
              key={fitur.href}
              href={fitur.href}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md"
            >
              <p className="font-bold text-slate-900">
                {fitur.judul}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {fitur.deskripsi}
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-blue-700">
                Lihat Laporan →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}