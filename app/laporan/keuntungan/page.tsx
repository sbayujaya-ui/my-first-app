"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ambilDetailKeuntungan,
  hitungRekapKeuntungan,
  type DetailKeuntungan,
} from "../../../lib/penjualan/keuntunganService";

function bulanWIBHariIni() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function formatRupiah(nilai: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

function formatPersen(nilai: number | null) {
  if (nilai === null || !Number.isFinite(nilai)) {
    return "Belum tersedia";
  }

  return `${nilai.toFixed(2).replace(".", ",")}%`;
}

function formatTanggal(tanggal: string) {
  if (!tanggal) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(tanggal));
}

type RekapProduk = {
  productId: number;
  nama: string;
  kode: string;
  jumlah: number;
  jumlahDenganHargaBeli: number;
  jumlahTanpaHargaBeli: number;
  omzet: number;
  modal: number | null;
  keuntungan: number | null;
  marginPersen: number | null;
};

export default function LaporanKeuntunganPage() {
  const [bulanDipilih, setBulanDipilih] =
    useState(bulanWIBHariIni());

  const [detail, setDetail] =
    useState<DetailKeuntungan[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function ambilData() {
    try {
      setLoading(true);
      setError("");

      const hasil =
        await ambilDetailKeuntungan(bulanDipilih);

      if (hasil.error) {
        throw hasil.error;
      }

      setDetail(hasil.data);
    } catch (err) {
      console.error("Laporan keuntungan:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil laporan keuntungan."
      );

      setDetail([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ambilData();
  }, [bulanDipilih]);

  const rekap = useMemo(
    () => hitungRekapKeuntungan(detail),
    [detail]
  );

  const rekapProduk = useMemo(() => {
    const map = new Map<number, RekapProduk>();

    for (const item of detail) {
      const existing = map.get(item.productId);

      if (!existing) {
        const jumlahDenganHargaBeli =
          item.hargaBeliTersedia ? item.jumlah : 0;

        const jumlahTanpaHargaBeli =
          item.hargaBeliTersedia ? 0 : item.jumlah;

        map.set(item.productId, {
          productId: item.productId,
          nama: item.productNama,
          kode: item.productKode,
          jumlah: item.jumlah,
          jumlahDenganHargaBeli,
          jumlahTanpaHargaBeli,
          omzet: item.omzet,
          modal: item.hargaBeliTersedia
            ? item.modal ?? 0
            : null,
          keuntungan: item.hargaBeliTersedia
            ? item.keuntungan ?? 0
            : null,
          marginPersen:
            item.hargaBeliTersedia &&
            item.omzet > 0 &&
            item.keuntungan !== null
              ? (item.keuntungan / item.omzet) * 100
              : null,
        });

        continue;
      }

      existing.jumlah += item.jumlah;
      existing.omzet += item.omzet;

      if (item.hargaBeliTersedia) {
        existing.jumlahDenganHargaBeli += item.jumlah;
        existing.modal =
          (existing.modal ?? 0) + (item.modal ?? 0);
        existing.keuntungan =
          (existing.keuntungan ?? 0) +
          (item.keuntungan ?? 0);
      } else {
        existing.jumlahTanpaHargaBeli += item.jumlah;
      }

      existing.marginPersen =
        existing.modal !== null &&
        existing.keuntungan !== null &&
        existing.omzet > 0
          ? (existing.keuntungan /
              (
                existing.omzet -
                existing.jumlahTanpaHargaBeli *
                  (
                    existing.omzet /
                    existing.jumlah
                  )
              )) * 100
          : null;
    }

    return Array.from(map.values()).sort(
      (a, b) => b.omzet - a.omzet
    );
  }, [detail]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <header className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                  LAPORAN
                </span>

                <span className="text-xs font-medium text-slate-500">
                  Keuntungan diketahui
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Rekap Keuntungan diketahui
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Rekap omzet, modal barang, dan keuntungan
                berdasarkan harga beli yang tersimpan saat transaksi.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="/laporan/harian"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Harian
              </a>

              <a
                href="/laporan/bulanan"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Bulanan
              </a>

              <a
                href="/laporan"
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
              >
                Riwayat
              </a>
            </div>

          </div>
        </header>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <label
                htmlFor="bulan-keuntungan"
                className="block text-sm font-bold text-slate-800"
              >
                Pilih Bulan
              </label>

              <p className="mt-1 text-xs text-slate-500">
                Perhitungan menggunakan zona waktu WIB.
              </p>
            </div>

            <input
              id="bulan-keuntungan"
              type="month"
              value={bulanDipilih}
              onChange={(event) =>
                setBulanDipilih(event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Omzet
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatRupiah(rekap.omzet)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total penjualan
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Modal diketahui
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {rekap.modalDiketahui === null
                ? "Belum tersedia"
                : formatRupiah(rekap.modalDiketahui)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Harga beli tersedia
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Keuntungan diketahui
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {rekap.keuntunganDiketahui === null
                ? "Belum tersedia"
                : formatRupiah(rekap.keuntunganDiketahui)}
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              Omzet - modal
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Margin diketahui
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatPersen(rekap.marginPersenDiketahui)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Keuntungan diketahui / omzet
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Transaksi
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {rekap.transaksi}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {rekap.itemTerjual} item terjual
            </p>
          </div>

        </section>

        {!loading && rekap.itemTanpaHargaBeli > 0 && (
          <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-900">
              Sebagian harga beli belum tersedia
            </h2>

            <p className="mt-1 text-sm text-amber-800">
              Sebagian transaksi pada bulan ini belum memiliki
              snapshot harga beli. Keuntungan diketahui total belum dihitung
              agar laporan tidak memberikan angka yang menyesatkan.
            </p>

            <p className="mt-2 text-xs font-bold text-amber-800">
              Item tanpa harga beli: {rekap.itemTanpaHargaBeli}
            </p>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Rekap Per Produk
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Produk diurutkan berdasarkan omzet terbesar.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-600">
              Memuat rekap keuntungan...
            </div>
          ) : rekapProduk.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-bold text-slate-800">
                Tidak ada transaksi
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Belum ada transaksi pada bulan yang dipilih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left text-sm">

                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase">
                      Produk
                    </th>

                    <th className="px-4 py-3.5 text-xs font-bold uppercase">
                      Terjual
                    </th>

                    <th className="px-4 py-3.5 text-xs font-bold uppercase">
                      Omzet
                    </th>

                    <th className="px-4 py-3.5 text-xs font-bold uppercase">
                      Modal
                    </th>

                    <th className="px-4 py-3.5 text-xs font-bold uppercase">
                      Keuntungan diketahui
                    </th>

                    <th className="px-4 py-3.5 text-xs font-bold uppercase">
                      Margin diketahui
                    </th>

                    <th className="px-4 py-3.5 text-xs font-bold uppercase">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">

                  {rekapProduk.map((produk) => (
                    <tr
                      key={produk.productId}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">
                          {produk.nama}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {produk.kode}
                        </p>
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-900">
                        {produk.jumlah}
                        <div className="mt-1 text-xs font-medium text-slate-500">
                          {produk.jumlahDenganHargaBeli} dengan modal
                          {produk.jumlahTanpaHargaBeli > 0
                            ? ` • ${produk.jumlahTanpaHargaBeli} belum`
                            : ""}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-900">
                        {formatRupiah(produk.omzet)}
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700">
                        {produk.jumlahDenganHargaBeli > 0
                          ? formatRupiah(produk.modal ?? 0)
                          : "Belum tersedia"}
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-900">
                        {produk.jumlahDenganHargaBeli > 0
                          ? formatRupiah(produk.keuntungan ?? 0)
                          : "Belum tersedia"}
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700">
                        {produk.marginPersen !== null
                          ? `${produk.marginPersen.toFixed(2)}%`
                          : "Belum tersedia"}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={
                            produk.jumlahTanpaHargaBeli === 0
                              ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                              : produk.jumlahDenganHargaBeli > 0
                                ? "rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700"
                                : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                          }
                        >
                          {produk.jumlahTanpaHargaBeli === 0
                            ? "Lengkap"
                            : produk.jumlahDenganHargaBeli > 0
                              ? "Sebagian tersedia"
                              : "Belum tersedia"}
                        </span>
                      </td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Catatan Perhitungan
          </h2>

          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">

            <p>
              <strong>Modal</strong> = harga beli × jumlah
            </p>

            <p>
              <strong>Omzet</strong> = harga jual × jumlah
            </p>

            <p>
              <strong>Keuntungan diketahui</strong> = omzet - modal
            </p>

            <p>
              <strong>Margin diketahui</strong> = keuntungan ÷ omzet × 100%
            </p>

          </div>

          <p className="mt-4 text-xs text-slate-500">
            Keuntungan diketahui hanya dihitung ketika harga beli tersimpan
            pada saat transaksi.
          </p>
        </section>

        <footer className="mt-6 text-center text-xs text-slate-500">
          WARUNG HRD • Rekap Keuntungan diketahui
        </footer>

      </div>
    </main>
  );
}
