// ===== UPDATE START: WH-PENJUALAN-PRODUK-001 =====

"use client";

import { useEffect, useState } from "react";
import { ambilSemuaProduk } from "../../../lib/produk/produkService";

type Produk = {
  id: number;
  kode: string;
  nama: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
};

type ProdukPenjualanProps = {
  onTambahProduk?: (produk: Produk) => void;
};

export default function ProdukPenjualan({
  onTambahProduk,
}: ProdukPenjualanProps) {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchProduk, setSearchProduk] = useState("");

  const ambilProduk = async () => {
    setLoading(true);

    const { data, error } = await ambilSemuaProduk();

    if (error) {
      console.error("Gagal mengambil produk:", error.message);
      alert("Gagal mengambil data produk: " + error.message);
      setLoading(false);
      return;
    }

    if (data) {
      const dataProduk: Produk[] = data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        hargaBeli: Number(item.harga_beli),
        hargaJual: Number(item.harga_jual),
        stok: Number(item.stok),
      }));

      setProduk(dataProduk);
    } else {
      setProduk([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    ambilProduk();
  }, []);

  const produkTersaring = produk.filter((item) => {
    const kataPencarian = searchProduk.trim().toLowerCase();

    if (!kataPencarian) {
      return true;
    }

    return (
      item.kode.toLowerCase().includes(kataPencarian) ||
      item.nama.toLowerCase().includes(kataPencarian)
    );
  });

  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      {/* =========================
          HEADER
      ========================= */}

      <h2 className="text-xl font-bold text-gray-900">
        Pilih Produk
      </h2>

      {/* =========================
          SEARCH
      ========================= */}

      <div className="mt-4">
        <input
          type="text"
          placeholder="Cari produk berdasarkan kode atau nama..."
          value={searchProduk}
          onChange={(e) => setSearchProduk(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-black"
        />
      </div>

      {/* =========================
          DAFTAR PRODUK
      ========================= */}

      <div className="mt-4">

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Memuat produk...
          </div>
        ) : produkTersaring.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {searchProduk.trim()
              ? "Produk tidak ditemukan."
              : "Belum ada produk."}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">

            {produkTersaring.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
              >

                <div>
                  <div className="font-semibold text-gray-900">
                    {item.nama}
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    {item.kode}
                  </div>

                  <div className="mt-2 font-medium text-gray-900">
                    Rp{" "}
                    {item.hargaJual.toLocaleString("id-ID")}
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    Stok: {item.stok}
                  </div>
                </div>

                <button
  type="button"
  onClick={() => onTambahProduk?.(item)}
  disabled={item.stok <= 0}
  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
>
  {item.stok <= 0 ? "Habis" : "+ Tambah"}
</button>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

// ===== UPDATE END: WH-PENJUALAN-PRODUK-001 =====