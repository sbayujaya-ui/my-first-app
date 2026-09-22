"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";

type Penjualan = {
  id: number;
  tanggal: string;
  total: number;
  pembayaran: number;
  kembalian: number;
};

type ItemPenjualan = {
  id: number;
  sale_id: number;
  product_id: number;
  harga: number;
  jumlah: number;
  subtotal: number;
};

function formatRupiah(nilai: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

function formatTanggal(tanggal: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(tanggal));
}

function tanggalWIBHariIni() {
  const sekarang = new Date();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(sekarang);
}

function buatRentangTanggal(tanggal: string) {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);

  const awal = new Date(
    Date.UTC(tahun, bulan - 1, hari, -7, 0, 0, 0)
  );

  const akhir = new Date(
    Date.UTC(tahun, bulan - 1, hari + 1, -7, 0, 0, 0)
  );

  return {
    awal: awal.toISOString(),
    akhir: akhir.toISOString(),
  };
}

export default function LaporanHarianPage() {
  const [tanggalDipilih, setTanggalDipilih] = useState(tanggalWIBHariIni());

  const [dataPenjualan, setDataPenjualan] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailTerbuka, setDetailTerbuka] = useState<number | null>(null);
  const [detail, setDetail] = useState<ItemPenjualan[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function ambilData() {
    try {
      setLoading(true);
      setError("");
      setDetailTerbuka(null);
      setDetail([]);

      const supabase = createClient();
      const { awal, akhir } = buatRentangTanggal(tanggalDipilih);

      const { data, error: queryError } = await supabase
        .from("sales")
        .select("id, total, pembayaran, kembalian, tanggal")
        .gte("tanggal", awal)
        .lt("tanggal", akhir)
        .order("tanggal", { ascending: false });

      if (queryError) {
        console.error("Laporan harian error:", queryError);
        throw new Error(queryError.message);
      }

      setDataPenjualan((data ?? []) as Penjualan[]);
    } catch (err) {
      console.error("Laporan harian error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil laporan harian."
      );
    } finally {
      setLoading(false);
    }
  }

  async function bukaDetail(saleId: number) {
    if (detailTerbuka === saleId) {
      setDetailTerbuka(null);
      setDetail([]);
      return;
    }

    try {
      setLoadingDetail(true);
      setError("");

      const supabase = createClient();

      const { data, error: queryError } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", saleId)
        .order("id", { ascending: true });

      if (queryError) {
        console.error("Detail penjualan error:", queryError);
        throw new Error(queryError.message);
      }

      setDetail((data ?? []) as ItemPenjualan[]);
      setDetailTerbuka(saleId);
    } catch (err) {
      console.error("Detail penjualan error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil detail transaksi."
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    ambilData();
  }, [tanggalDipilih]);

  const totalPenjualan = dataPenjualan.reduce(
    (total, item) => total + Number(item.total ?? 0),
    0
  );

  const totalPembayaran = dataPenjualan.reduce(
    (total, item) => total + Number(item.pembayaran ?? 0),
    0
  );

  const totalKembalian = dataPenjualan.reduce(
    (total, item) => total + Number(item.kembalian ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Laporan Harian
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Ringkasan dan transaksi penjualan berdasarkan tanggal.
            </p>
          </div>

          <a
            href="/laporan"
            className="w-fit rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Kembali ke Riwayat
          </a>
        </div>

        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <label
            htmlFor="tanggal-laporan"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Pilih Tanggal
          </label>

          <input
            id="tanggal-laporan"
            type="date"
            value={tanggalDipilih}
            onChange={(event) => setTanggalDipilih(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Penjualan</p>
            <p className="mt-2 text-xl font-bold text-gray-900">
              {formatRupiah(totalPenjualan)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Transaksi</p>
            <p className="mt-2 text-xl font-bold text-gray-900">
              {dataPenjualan.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Pembayaran</p>
            <p className="mt-2 text-xl font-bold text-gray-900">
              {formatRupiah(totalPembayaran)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Kembalian</p>
            <p className="mt-2 text-xl font-bold text-gray-900">
              {formatRupiah(totalKembalian)}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-bold text-gray-900">
              Transaksi Harian
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500">
              Memuat laporan...
            </div>
          ) : dataPenjualan.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              Tidak ada transaksi pada tanggal ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Pembayaran</th>
                    <th className="px-5 py-3">Kembalian</th>
                    <th className="px-5 py-3">Detail</th>
                  </tr>
                </thead>

                <tbody>
                  {dataPenjualan.map((penjualan) => (
                    <tr
                      key={penjualan.id}
                      className="border-t border-gray-200"
                    >
                      <td
                        className="px-5 py-4 font-bold"
                        style={{ color: "#0f172a", opacity: 1 }}
                      >
                        #{penjualan.id}
                      </td>

                      <td className="px-5 py-4" style={{ color: "#334155" }}>
                        {formatTanggal(penjualan.tanggal)}
                      </td>

                      <td
                        className="px-5 py-4 font-bold"
                        style={{ color: "#0f172a", opacity: 1 }}
                      >
                        {formatRupiah(Number(penjualan.total))}
                      </td>

                      <td className="px-5 py-4" style={{ color: "#334155" }}>
                        {formatRupiah(Number(penjualan.pembayaran))}
                      </td>

                      <td className="px-5 py-4" style={{ color: "#334155" }}>
                        {formatRupiah(Number(penjualan.kembalian))}
                      </td>

                      <td className="px-5 py-4" style={{ color: "#334155" }}>
                        <button
                          type="button"
                          onClick={() => bukaDetail(penjualan.id)}
                          className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                        >
                          {detailTerbuka === penjualan.id
                            ? "Tutup Detail"
                            : "Lihat Detail"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {detailTerbuka !== null && (
                    <tr>
                      <td
                        colSpan={6}
                        className="bg-gray-50 px-5 py-4"
                      >
                        {loadingDetail ? (
                          <p className="text-sm text-gray-500">
                            Memuat detail...
                          </p>
                        ) : detail.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Detail transaksi tidak ditemukan.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 text-gray-600">
                                  <th className="px-3 py-2">
                                    Product ID
                                  </th>
                                  <th className="px-3 py-2">
                                    Harga
                                  </th>
                                  <th className="px-3 py-2">
                                    Jumlah
                                  </th>
                                  <th className="px-3 py-2">
                                    Subtotal
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {detail.map((item) => (
                                  <tr
                                    key={item.id}
                                    className="border-b border-gray-100"
                                  >
                                    <td className="px-3 py-2">
                                      #{item.product_id}
                                    </td>

                                    <td className="px-3 py-2">
                                      {formatRupiah(Number(item.harga))}
                                    </td>

                                    <td className="px-3 py-2">
                                      {item.jumlah}
                                    </td>

                                    <td className="px-3 py-2 font-semibold">
                                      {formatRupiah(
                                        Number(item.subtotal)
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
