"use client";

import { useEffect, useState } from "react";
import {
  ambilSemuaPenjualan,
  ambilItemPenjualan,
} from "../../lib/penjualan/penjualanService";

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
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(tanggal));
}

export default function LaporanPage() {
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [detail, setDetail] = useState<ItemPenjualan[]>([]);
  const [terpilih, setTerpilih] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  async function ambilData() {
    try {
      setLoading(true);
      setError("");

      const { data, error: queryError } =
        await ambilSemuaPenjualan();

      if (queryError) {
        throw new Error(queryError.message);
      }

      setPenjualan((data ?? []) as Penjualan[]);
    } catch (err) {
      console.error("REP-001 error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil riwayat penjualan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function bukaDetail(saleId: number) {
    if (terpilih === saleId) {
      setTerpilih(null);
      setDetail([]);
      return;
    }

    try {
      setTerpilih(saleId);
      setLoadingDetail(true);
      setError("");

      const { data, error: queryError } =
        await ambilItemPenjualan(saleId);

      if (queryError) {
        throw new Error(queryError.message);
      }

      setDetail((data ?? []) as ItemPenjualan[]);
    } catch (err) {
      console.error("REP-001 detail error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil detail transaksi."
      );
      setDetail([]);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    ambilData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">

        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Riwayat Penjualan
            </h1>

            <p className="mt-2 text-gray-600">
              Daftar transaksi penjualan yang tersimpan.
            </p>
          </div>

          <a
            href="/"
            className="inline-block rounded-lg bg-black px-4 py-2 text-center text-white"
          >
            Kembali ke Dashboard
          </a>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Daftar Transaksi
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">
              Memuat riwayat penjualan...
            </div>
          ) : penjualan.length === 0 ? (
            <div className="p-6 text-gray-500">
              Belum ada transaksi penjualan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Total
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Pembayaran
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Kembalian
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Detail
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {penjualan.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        #{item.id}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {formatTanggal(item.tanggal)}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatRupiah(Number(item.total))}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {formatRupiah(Number(item.pembayaran))}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {formatRupiah(Number(item.kembalian))}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => bukaDetail(item.id)}
                          className="rounded-lg bg-black px-3 py-2 text-sm text-white"
                        >
                          {terpilih === item.id
                            ? "Tutup"
                            : "Lihat Detaill"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {terpilih !== null && (
                    <tr className="border-t bg-gray-50">
                      <td
                        colSpan={6}
                        className="px-6 py-6"
                      >
                        <div className="rounded-xl border bg-white p-5">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Detail Transaksi #{terpilih}
                          </h3>

                          {loadingDetail ? (
                            <p className="mt-4 text-gray-500">
                              Memuat detail transaksi...
                            </p>
                          ) : detail.length === 0 ? (
                            <p className="mt-4 text-gray-500">
                              Tidak ada item pada transaksi ini.
                            </p>
                          ) : (
                            <div className="mt-4 overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-sm font-semibold">
                                      Product ID
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold">
                                      Harga
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold">
                                      Jumlah
                                    </th>
                                    <th className="px-4 py-3 text-sm font-semibold">
                                      Subtotal
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {detail.map((barang) => (
                                    <tr
                                      key={barang.id}
                                      className="border-t"
                                    >
                                      <td className="px-4 py-3">
                                        #{barang.product_id}
                                      </td>

                                      <td className="px-4 py-3">
                                        {formatRupiah(
                                          Number(barang.harga)
                                        )}
                                      </td>

                                      <td className="px-4 py-3">
                                        {barang.jumlah}
                                      </td>

                                      <td className="px-4 py-3 font-medium">
                                        {formatRupiah(
                                          Number(barang.subtotal)
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
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
