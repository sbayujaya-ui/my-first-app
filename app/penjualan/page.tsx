// ===== UPDATE START: WH-PENJUALAN-PAGE-006 / SELL-004 =====

"use client";

import { useState } from "react";
import ProdukPenjualan from "../produk/penjualan/ProdukPenjualan";
import BarcodeScanner from "../components/BarcodeScanner";
import { buatTransaksiPenjualan } from "../../lib/penjualan/penjualanService";

type Produk = {
  id: number;
  kode: string;
  nama: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
};

type ItemKeranjang = Produk & {
  jumlah: number;
};

export default function PenjualanPage() {
  const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([]);
  const [pembayaran, setPembayaran] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);


  const handleScanBarcode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();

    if (!code) {
      return;
    }

    try {
      const { createClient } = await import(
        "../../utils/supabase/client"
      );

      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select(
          "id,nama,kode,harga_beli,harga_jual,stok"
        )
        .eq("kode", code)
        .maybeSingle();

      if (error) {
        console.error(
          "[PWA-003.3] Gagal mencari barcode:",
          error
        );

        alert(
          "Gagal mencari produk: " +
            error.message
        );

        return;
      }

      if (!data) {
        alert(
          'Produk dengan kode "' +
            code +
            '" tidak ditemukan.'
        );

        return;
      }

      const produk: Produk = {
        id: Number(data.id),
        kode: String(data.kode ?? ""),
        nama: String(data.nama ?? ""),
        hargaBeli: Number(
          data.harga_beli ?? 0
        ),
        hargaJual: Number(
          data.harga_jual ?? 0
        ),
        stok: Number(data.stok ?? 0),
      };

      if (produk.stok <= 0) {
        alert(
          'Produk "' +
            produk.nama +
            '" sedang habis.'
        );

        return;
      }

      handleTambahProduk(produk);

    } catch (error) {
      console.error(
        "[PWA-003.3] Barcode error:",
        error
      );

      alert(
        "Terjadi kesalahan saat membaca produk."
      );
    }
  };

  const handleTambahProduk = (produk: Produk) => {
    setKeranjang((keranjangLama) => {
      const itemSudahAda = keranjangLama.find(
        (item) => item.id === produk.id
      );

      if (itemSudahAda) {
        if (itemSudahAda.jumlah >= produk.stok) {
          alert("Jumlah melebihi stok yang tersedia.");
          return keranjangLama;
        }

        return keranjangLama.map((item) =>
          item.id === produk.id
            ? { ...item, jumlah: item.jumlah + 1 }
            : item
        );
      }

      return [
        ...keranjangLama,
        {
          ...produk,
          jumlah: 1,
        },
      ];
    });
  };

  const tambahJumlah = (id: number) => {
    setKeranjang((keranjangLama) =>
      keranjangLama.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (item.jumlah >= item.stok) {
          alert("Jumlah melebihi stok yang tersedia.");
          return item;
        }

        return {
          ...item,
          jumlah: item.jumlah + 1,
        };
      })
    );
  };

  const kurangiJumlah = (id: number) => {
    setKeranjang((keranjangLama) =>
      keranjangLama
        .map((item) =>
          item.id === id
            ? { ...item, jumlah: item.jumlah - 1 }
            : item
        )
        .filter((item) => item.jumlah > 0)
    );
  };

  const hapusDariKeranjang = (id: number) => {
    setKeranjang((keranjangLama) =>
      keranjangLama.filter((item) => item.id !== id)
    );
  };

  async function simpanTransaksi() {
    if (menyimpan) {
      return;
    }

    if (!Array.isArray(keranjang) || keranjang.length === 0) {
      alert("Keranjang masih kosong.");
      return;
    }

    for (const item of keranjang) {
      const productId = Number(item.id);
      const jumlah = Number(item.jumlah);
      const hargaBeli = Number(item.hargaBeli);
      const hargaJual = Number(item.hargaJual);
      const stok = Number(item.stok);

      if (!Number.isInteger(productId) || productId <= 0) {
        alert("Data produk tidak valid.");
        return;
      }

      if (!Number.isInteger(jumlah) || jumlah <= 0) {
        alert("Jumlah produk harus minimal 1.");
        return;
      }

      if (!Number.isInteger(stok) || stok < 0) {
        alert("Data stok produk tidak valid.");
        return;
      }

      if (jumlah > stok) {
        alert(
          `Stok produk "${item.nama}" tidak mencukupi. Stok tersedia: ${stok}.`
        );
        return;
      }

      if (!Number.isFinite(hargaBeli) || hargaBeli < 0) {
        alert("Harga beli produk tidak valid.");
        return;
      }

      if (!Number.isFinite(hargaJual) || hargaJual < 0) {
        alert("Harga jual produk tidak valid.");
        return;
      }
    }

    const totalValid = keranjang.reduce(
      (sum, item) =>
        sum + Number(item.hargaJual) * Number(item.jumlah),
      0
    );

    if (!Number.isFinite(totalValid) || totalValid < 0) {
      alert("Total transaksi tidak valid.");
      return;
    }

    if (Math.abs(totalValid - total) > 0.01) {
      alert("Total transaksi tidak sinkron. Silakan periksa keranjang.");
      return;
    }

    if (!Number.isFinite(nilaiPembayaran) || nilaiPembayaran < 0) {
      alert("Nilai pembayaran tidak valid.");
      return;
    }

    if (nilaiPembayaran < totalValid) {
      alert("Pembayaran masih kurang.");
      return;
    }

    const kembalianValid = nilaiPembayaran - totalValid;

    if (!Number.isFinite(kembalianValid) || kembalianValid < 0) {
      alert("Nilai kembalian tidak valid.");
      return;
    }

    try {
      setMenyimpan(true);

      const { data: penjualan, error: errorPenjualan } =
        await buatTransaksiPenjualan({
          items: keranjang.map((item) => ({
            product_id: item.id,
            jumlah: item.jumlah,
          })),
          pembayaran: nilaiPembayaran,
        });

      if (errorPenjualan || !penjualan) {
        throw errorPenjualan || new Error("Gagal menyimpan transaksi.");
      }

      alert("Transaksi berhasil disimpan.");

      setKeranjang([]);
      setPembayaran("");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan transaksi."
      );
    } finally {
      setMenyimpan(false);
    }
  }

  const total = keranjang.reduce(
    (jumlahTotal, item) =>
      jumlahTotal + item.hargaJual * item.jumlah,
    0
  );

  const nilaiPembayaran = Number(pembayaran) || 0;
  const kembalian =
    nilaiPembayaran >= total
      ? nilaiPembayaran - total
      : 0;

  const pembayaranKurang =
    keranjang.length > 0 &&
    nilaiPembayaran > 0 &&
    nilaiPembayaran < total;

  const pembayaranCukup =
    keranjang.length > 0 &&
    nilaiPembayaran >= total;

  const formatRupiah = (nilai: number) =>
    "Rp " + nilai.toLocaleString("id-ID");

  const handlePembayaran = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const hanyaAngka = event.target.value.replace(/[^0-9]/g, "");
    setPembayaran(hanyaAngka);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Penjualan
          </h1>

          <p className="mt-2 text-gray-600">
            Kelola transaksi penjualan Warung HRD.
          </p>
        </div>

        {/* =========================
            PILIH PRODUK
        ========================= */}

        <div className="mb-6">
          <BarcodeScanner
            onDetected={handleScanBarcode}
          />
        </div>

        <ProdukPenjualan
          onTambahProduk={handleTambahProduk}
        />

        {/* =========================
            KERANJANG
        ========================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow">

          <h2 className="text-xl font-bold text-gray-900">
            Keranjang
          </h2>

          {keranjang.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 py-10 text-center text-gray-500">
              Belum ada produk di keranjang.
            </div>
          ) : (
            <div className="mt-6 space-y-4">

              {keranjang.map((item) => {
                const subtotal = item.hargaJual * item.jumlah;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      {/* INFO PRODUK */}

                      <div>
                        <div className="font-semibold text-gray-900">
                          {item.nama}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          {item.kode}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          Harga: {formatRupiah(item.hargaJual)}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          Stok: {item.stok}
                        </div>
                      </div>

                      {/* JUMLAH */}

                      <div className="flex items-center gap-2">

                        <button
              type="button"
              onClick={simpanTransaksi}
              disabled={
                keranjang.length === 0 ||
                nilaiPembayaran < total ||
                menyimpan
              }
              className="mt-4 w-full rounded-xl bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {menyimpan ? "Menyimpan..." : "Simpan Transaksi"}
            </button>

            <button
                          type="button"
                          onClick={() => kurangiJumlah(item.id)}
                          className="h-9 w-9 rounded-lg border border-gray-300 bg-white text-lg font-bold text-gray-900 hover:bg-gray-100"
                        >
                          -
                        </button>

                        <div className="flex h-9 min-w-12 items-center justify-center rounded-lg border border-gray-300 px-3 font-semibold text-gray-900">
                          {item.jumlah}
                        </div>

                        <button
                          type="button"
                          onClick={() => tambahJumlah(item.id)}
                          disabled={item.jumlah >= item.stok}
                          className="h-9 w-9 rounded-lg bg-black text-lg font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>

                      </div>

                      {/* SUBTOTAL */}

                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Subtotal
                        </div>

                        <div className="font-bold text-gray-900">
                          {formatRupiah(subtotal)}
                        </div>
                      </div>

                      {/* HAPUS */}

                      <button
                        type="button"
                        onClick={() => hapusDariKeranjang(item.id)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

          {/* =========================
              TOTAL
          ========================= */}

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">

            <span className="text-lg font-semibold text-gray-700">
              Total
            </span>

            <span className="text-2xl font-bold text-gray-900">
              {formatRupiah(total)}
            </span>

          </div>

        </div>

        {/* =========================
            PEMBAYARAN
        ========================= */}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow">

          <h2 className="text-xl font-bold text-gray-900">
            Pembayaran
          </h2>

          <div className="mt-4">

            <label
              htmlFor="pembayaran"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Uang Dibayar
            </label>

            <input
              id="pembayaran"
              type="text"
              inputMode="numeric"
              value={
                pembayaran
                  ? Number(pembayaran).toLocaleString("id-ID")
                  : ""
              }
              onChange={handlePembayaran}
              placeholder="Masukkan jumlah uang..."
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-lg text-gray-900 outline-none focus:border-black"
            />

          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">

            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Total Belanja
              </span>

              <span className="font-semibold text-gray-900">
                {formatRupiah(total)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-gray-600">
                Dibayar
              </span>

              <span className="font-semibold text-gray-900">
                {formatRupiah(nilaiPembayaran)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">

              <span className="font-semibold text-gray-700">
                Kembalian
              </span>

              <span className="text-xl font-bold text-gray-900">
                {formatRupiah(kembalian)}
              </span>

            </div>

            {pembayaranKurang && (
              <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700">
                Pembayaran masih kurang{" "}
                {formatRupiah(total - nilaiPembayaran)}.
              </div>
            )}

            {pembayaranCukup && (
              <div className="mt-4 rounded-lg bg-green-100 p-3 text-sm font-medium text-green-700">
                Pembayaran cukup. Kembalian{" "}
                {formatRupiah(kembalian)}.
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}

// ===== UPDATE END: WH-PENJUALAN-PAGE-004 / SELL-004 =====

