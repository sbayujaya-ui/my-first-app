"use client";

import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import DashboardFeatureNavigation from "./components/dashboard/DashboardFeatureNavigation";

type Ringkasan = {
  penjualan: number;
  transaksi: number;
};

type RingkasanStok = {
  jenisProduk: number;
  totalStok: number;
  stokMenipis: number;
  stokHabis: number;
};


function formatRupiah(nilai: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

export default function Home() {
  const [ringkasan, setRingkasan] = useState<Ringkasan>({
    penjualan: 0,
    transaksi: 0,
  });


  const [ringkasanStok, setRingkasanStok] = useState<RingkasanStok>({
    jenisProduk: 0,
    totalStok: 0,
    stokMenipis: 0,
    stokHabis: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function ambilData() {
      try {
        setLoading(true);
        setError("");

        const supabase = createClient();

        const sekarang = new Date();

        const formatter = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        const bagianTanggal = formatter.formatToParts(sekarang);

        const tahun = Number(
          bagianTanggal.find((bagian) => bagian.type === "year")?.value
        );

        const bulan = Number(
          bagianTanggal.find((bagian) => bagian.type === "month")?.value
        );

        const hari = Number(
          bagianTanggal.find((bagian) => bagian.type === "day")?.value
        );

        const awalHari = new Date(
          Date.UTC(tahun, bulan - 1, hari, -7, 0, 0, 0)
        );

        const akhirHari = new Date(
          Date.UTC(tahun, bulan - 1, hari + 1, -7, 0, 0, 0)
        );

        const { data, error: queryError } = await supabase
          .from("sales")
          .select("id, total, tanggal")
          .gte("tanggal", awalHari.toISOString())
          .lt("tanggal", akhirHari.toISOString())
          .order("tanggal", { ascending: false });

        if (queryError) {
          console.error("Dashboard sales error:", queryError);
          throw new Error(queryError.message);
        }

        const transaksi = data?.length ?? 0;

        const penjualan = (data ?? []).reduce(
          (total, item) => total + Number(item.total ?? 0),
          0
        );

        setRingkasan({
          penjualan,
          transaksi,
        });
        // DASH003_STOCK_QUERY
        const {
          data: produkData,
          error: produkError,
        } = await supabase
          .from("products")
          .select("id, stok");

        if (produkError) {
          console.error(
            "Dashboard products error:",
            produkError
          );
          throw new Error(produkError.message);
        }

        const daftarProduk = produkData ?? [];

        const jenisProduk = daftarProduk.length;

        const totalStok = daftarProduk.reduce(
          (total, produk) =>
            total + Number(produk.stok ?? 0),
          0
        );

        const stokMenipis = daftarProduk.filter(
          (produk) => {
            const stok = Number(produk.stok ?? 0);

            return stok > 0 && stok <= 5;
          }
        ).length;

        const stokHabis = daftarProduk.filter(
          (produk) =>
            Number(produk.stok ?? 0) <= 0
        ).length;

        setRingkasanStok({
          jenisProduk,
          totalStok,
          stokMenipis,
          stokHabis,
        });

      } catch (err) {
        console.error("Dashboard error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data penjualan."
        );
      } finally {
        setLoading(false);
      }
    }

    ambilData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            WARUNG HRD
          </h1>

          <p className="mt-2 text-gray-600">
            Sistem Pengelolaan Warung & Toko
          </p>
        </header>

        {/* Dashboard Navigation */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* Produk */}
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="text-3xl"></div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Produk
            </h2>

            <p className="mt-2 text-gray-600">
              Kelola daftar produk dan harga.
            </p>

            <a
              href="/produk"
              className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white"
            >
              Kelola Produk
            </a>
          </div>

          {/* Penjualan */}
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="text-3xl"></div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Penjualan
            </h2>

            <p className="mt-2 text-gray-600">
              Catat transaksi penjualan.
            </p>

            <a
              href="/penjualan"
              className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white"
            >
              Penjualan
            </a>
          </div>

          {/* Stok */}
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="text-3xl"></div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Stok
            </h2>

            <p className="mt-2 text-gray-600">
              Pantau jumlah stok barang.
            </p>

            <a
              href="/produk"
              className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white"
            >
              Lihat Stok
            </a>
          </div>

          {/* Keuangan */}
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="text-3xl"></div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Keuangan
            </h2>

            <p className="mt-2 text-gray-600">
              Pantau pemasukan dan keuntungan.
            </p>

            <button
              type="button"
              className="mt-4 rounded-lg bg-black px-4 py-2 text-white"
            >
              Keuangan
            </button>
          </div>

        </section>


        {/* DASH003_STOCK_UI */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Ringkasan Stok
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-4">

            <div className="rounded-2xl bg-white p-6 shadow">
              <p className="text-sm text-gray-500">
                Jenis Produk
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? "..." : ringkasanStok.jenisProduk}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <p className="text-sm text-gray-500">
                Total Stok
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? "..." : ringkasanStok.totalStok}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <p className="text-sm text-gray-500">
                Stok Menipis
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-600">
                {loading ? "..." : ringkasanStok.stokMenipis}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <p className="text-sm text-gray-500">
                Stok Habis
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {loading ? "..." : ringkasanStok.stokHabis}
              </p>
            </div>

          </div>
        </section>

        {/* Ringkasan Hari Ini */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold text-gray-900">
            Ringkasan Hari Ini
          </h2>

          {loading ? (
            <div className="mt-6 rounded-xl bg-gray-100 p-5 text-gray-600">
              Memuat ringkasan penjualan...
            </div>
          ) : error ? (
            <div className="mt-6 rounded-xl bg-red-50 p-5 text-red-700">
              <p className="font-semibold">
                Gagal mengambil data penjualan.
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-3">

              {/* Penjualan */}
              <div className="rounded-xl bg-gray-100 p-5">
                <p className="text-sm text-gray-500">
                  Penjualan Hari Ini
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatRupiah(ringkasan.penjualan)}
                </p>
              </div>

              {/* Transaksi */}
              <div className="rounded-xl bg-gray-100 p-5">
                <p className="text-sm text-gray-500">
                  Transaksi
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {ringkasan.transaksi}
                </p>
              </div>

              {/* Keuntungan */}
              <div className="rounded-xl bg-gray-100 p-5">
                <p className="text-sm text-gray-500">
                  Keuntungan
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  Belum tersedia
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Membutuhkan data harga modal.
                </p>
              </div>

            </div>
          )}
        </section>

      </div>
    
        <DashboardFeatureNavigation />
</main>
  );
}

