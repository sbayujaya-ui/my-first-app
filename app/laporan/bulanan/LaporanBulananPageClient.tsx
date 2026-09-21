"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../utils/supabase/client";

type Penjualan = {
  id: number;
  tanggal: string;
  total: number;
  pembayaran: number;
  kembalian: number;
};

type RekapHarian = {
  tanggal: string;
  transaksi: number;
  penjualan: number;
};

function formatRupiah(nilai: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

function bulanWIBHariIni() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function buatRentangBulan(bulan: string) {
  const [tahun, nomorBulan] = bulan.split("-").map(Number);

  const awal = new Date(
    Date.UTC(tahun, nomorBulan - 1, 1, -7, 0, 0)
  );

  const akhir = new Date(
    Date.UTC(tahun, nomorBulan, 1, -7, 0, 0)
  );

  return {
    awal: awal.toISOString(),
    akhir: akhir.toISOString(),
  };
}

function tanggalWIB(tanggal: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(tanggal));
}

function formatTanggal(tanggal: string) {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(
    new Date(Date.UTC(tahun, bulan - 1, hari, 12))
  );
}

export default function LaporanBulananPage() {
  const [bulanDipilih, setBulanDipilih] =
    useState(bulanWIBHariIni());

  const [dataPenjualan, setDataPenjualan] =
    useState<Penjualan[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tanggalTerbuka, setTanggalTerbuka] =
    useState<string | null>(null);

  async function ambilData() {
    try {
      setLoading(true);
      setError("");
      setTanggalTerbuka(null);

      const supabase = createClient();

      const { awal, akhir } =
        buatRentangBulan(bulanDipilih);

      const { data, error: queryError } =
        await supabase
          .from("sales")
          .select(
            "id, total, pembayaran, kembalian, tanggal"
          )
          .gte("tanggal", awal)
          .lt("tanggal", akhir)
          .order("tanggal", {
            ascending: false,
          });

      if (queryError) {
        throw new Error(queryError.message);
      }

      setDataPenjualan(
        (data ?? []) as Penjualan[]
      );
    } catch (err) {
      console.error("Laporan bulanan:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil laporan bulanan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ambilData();
  }, [bulanDipilih]);

  const totalPenjualan = useMemo(
    () =>
      dataPenjualan.reduce(
        (total, item) =>
          total + Number(item.total ?? 0),
        0
      ),
    [dataPenjualan]
  );

  const totalPembayaran = useMemo(
    () =>
      dataPenjualan.reduce(
        (total, item) =>
          total + Number(item.pembayaran ?? 0),
        0
      ),
    [dataPenjualan]
  );

  const totalKembalian = useMemo(
    () =>
      dataPenjualan.reduce(
        (total, item) =>
          total + Number(item.kembalian ?? 0),
        0
      ),
    [dataPenjualan]
  );

  const rekapHarian = useMemo(() => {
    const hasil = new Map<string, RekapHarian>();

    for (const item of dataPenjualan) {
      const tanggal = tanggalWIB(item.tanggal);
      const existing = hasil.get(tanggal);

      if (existing) {
        existing.transaksi += 1;
        existing.penjualan += Number(item.total ?? 0);
      } else {
        hasil.set(tanggal, {
          tanggal,
          transaksi: 1,
          penjualan: Number(item.total ?? 0),
        });
      }
    }

    return Array.from(hasil.values()).sort(
      (a, b) => b.tanggal.localeCompare(a.tanggal)
    );
  }, [dataPenjualan]);

  const transaksiTanggalTerbuka =
    tanggalTerbuka
      ? dataPenjualan.filter(
          (item) =>
            tanggalWIB(item.tanggal) ===
            tanggalTerbuka
        )
      : [];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                  LAPORAN
                </span>

                <span className="text-xs font-medium text-slate-500">
                  Bulanan
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Laporan Bulanan
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Ringkasan penjualan dan rekap transaksi per hari.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="/laporan/harian"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Laporan Harian
              </a>

              <a
                href="/laporan"
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
              >
                Kembali ke Riwayat
              </a>
            </div>

          </div>
        </header>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <label
                htmlFor="bulan-laporan"
                className="block text-sm font-bold text-slate-800"
              >
                Pilih Bulan
              </label>

              <p className="mt-1 text-xs text-slate-500">
                Data transaksi menggunakan zona waktu WIB.
              </p>
            </div>

            <input
              id="bulan-laporan"
              type="month"
              value={bulanDipilih}
              onChange={(event) =>
                setBulanDipilih(event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-bold">
              Terjadi kesalahan
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Penjualan
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatRupiah(totalPenjualan)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total nilai penjualan
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Transaksi
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {dataPenjualan.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Jumlah transaksi
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Pembayaran
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatRupiah(totalPembayaran)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total uang diterima
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Kembalian
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatRupiah(totalKembalian)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total kembalian
            </p>
          </div>

        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Rekap Harian
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Penjualan yang dikelompokkan berdasarkan tanggal.
              </p>
            </div>

            {!loading && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {rekapHarian.length} hari aktif
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-600">
              Memuat laporan...
            </div>
          ) : rekapHarian.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-bold text-slate-800">
                Tidak ada transaksi
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Tidak ada transaksi pada bulan yang dipilih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[650px] text-left text-sm">

                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase">
                      Tanggal
                    </th>

                    <th className="px-5 py-3.5 text-xs font-bold uppercase">
                      Transaksi
                    </th>

                    <th className="px-5 py-3.5 text-xs font-bold uppercase">
                      Penjualan
                    </th>

                    <th className="px-5 py-3.5 text-xs font-bold uppercase">
                      Detail
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">

                  {rekapHarian.map((rekap) => (
                    <tr
                      key={rekap.tanggal}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatTanggal(rekap.tanggal)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {rekap.transaksi}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatRupiah(rekap.penjualan)}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setTanggalTerbuka(
                              tanggalTerbuka === rekap.tanggal
                                ? null
                                : rekap.tanggal
                            )
                          }
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          {tanggalTerbuka === rekap.tanggal
                            ? "Tutup"
                            : "Lihat Transaksi"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {tanggalTerbuka !== null && (
                    <tr>
                      <td
                        colSpan={4}
                        className="bg-slate-50 px-5 py-5"
                      >
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">

                          <div className="border-b border-slate-200 px-4 py-4">
                            <h3 className="font-bold text-slate-900">
                              Transaksi{" "}
                              {formatTanggal(tanggalTerbuka)}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {transaksiTanggalTerbuka.length} transaksi
                            </p>
                          </div>

                          <table className="w-full min-w-[700px] text-left text-sm">

                            <thead className="bg-slate-100">
                              <tr>
                                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700">
                                  ID
                                </th>

                                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700">
                                  Waktu
                                </th>

                                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700">
                                  Total
                                </th>

                                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700">
                                  Pembayaran
                                </th>

                                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700">
                                  Kembalian
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200">

                              {transaksiTanggalTerbuka.map(
                                (item) => (
                                  <tr key={item.id}>

                                    <td className="px-4 py-3 font-bold text-slate-900">
                                      #{item.id}
                                    </td>

                                    <td className="px-4 py-3 font-medium text-slate-700">
                                      {new Intl.DateTimeFormat(
                                        "id-ID",
                                        {
                                          timeZone: "Asia/Jakarta",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      ).format(
                                        new Date(item.tanggal)
                                      )}
                                    </td>

                                    <td className="px-4 py-3 font-bold text-slate-900">
                                      {formatRupiah(
                                        Number(item.total)
                                      )}
                                    </td>

                                    <td className="px-4 py-3 font-medium text-slate-700">
                                      {formatRupiah(
                                        Number(item.pembayaran)
                                      )}
                                    </td>

                                    <td className="px-4 py-3 font-medium text-slate-700">
                                      {formatRupiah(
                                        Number(item.kembalian)
                                      )}
                                    </td>

                                  </tr>
                                )
                              )}

                            </tbody>

                          </table>

                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        <footer className="mt-6 text-center text-xs text-slate-500">
          WARUNG HRD • Laporan Penjualan Bulanan
        </footer>

      </div>
    </main>
  );
}
