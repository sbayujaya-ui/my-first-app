// ===== UPDATE START: WH-REFACTOR-PRODUK-002B-FINAL =====

import {
  getStatusStok,
  getMargin,
} from "../../../lib/produk/produkUtils";

type Produk = {
  id: number;
  kode: string;
  nama: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
};

type ProdukTableProps = {
  loading: boolean;
  produkTersaring: Produk[];

  searchProduk: string;

  mulaiEdit: (item: Produk) => void;

  handleHapus: (item: Produk) => void | Promise<void>;

  deletingId: number | null;
};

export default function ProdukTable({
  loading,
  produkTersaring,
  searchProduk,
  mulaiEdit,
  handleHapus,
  deletingId,
}: ProdukTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow">

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900">

          {/* =========================
              HEADER TABLE
          ========================= */}

          <thead className="bg-gray-50">

            <tr>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Kode
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Produk
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Harga Beli
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Harga Jual
              </th>

              {/* =================================================
                  ===== UPDATE START: WH-PRODUK-MARGIN-001 =====
              ================================================= */}

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Margin
              </th>

              {/* =================================================
                  ===== UPDATE END: WH-PRODUK-MARGIN-001 =====
              ================================================= */}

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Stok
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Status Stok
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Aksi
              </th>

            </tr>

          </thead>

          {/* =========================
              BODY TABLE
          ========================= */}

          <tbody>

            {/* =========================
                LOADING
            ========================= */}

            {loading ? (

              <tr>

                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Memuat produk...
                </td>

              </tr>

            ) : produkTersaring.length === 0 ? (

              /* =========================
                  DATA KOSONG
              ========================= */

              <tr>

                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {searchProduk.trim()
                    ? "Produk tidak ditemukan."
                    : "Belum ada produk."}
                </td>

              </tr>

            ) : (

              /* =========================
                  DATA PRODUK
              ========================= */

              produkTersaring.map((item) => {

                const statusStok =
                  getStatusStok(item.stok);

                const margin =
                  getMargin(
                    item.hargaBeli,
                    item.hargaJual
                  );

                return (
                  <tr
                    key={item.id}
                    className="border-t"
                  >

                    {/* =========================
                        KODE
                    ========================= */}

                    <td className="px-6 py-4">
                      {item.kode}
                    </td>

                    {/* =========================
                        NAMA
                    ========================= */}

                    <td className="px-6 py-4 font-medium">
                      {item.nama}
                    </td>

                    {/* =========================
                        HARGA BELI
                    ========================= */}

                    <td className="px-6 py-4">
                      Rp{" "}
                      {item.hargaBeli.toLocaleString(
                        "id-ID"
                      )}
                    </td>

                    {/* =========================
                        HARGA JUAL
                    ========================= */}

                    <td className="px-6 py-4">
                      Rp{" "}
                      {item.hargaJual.toLocaleString(
                        "id-ID"
                      )}
                    </td>

                    {/* =================================================
                        ===== UPDATE START: WH-PRODUK-MARGIN-001 =====
                    ================================================= */}

                    {/* =========================
                        MARGIN
                    ========================= */}

                    <td className="px-6 py-4">

                      <div className="font-medium">
                        Rp{" "}
                        {margin.nominal.toLocaleString(
                          "id-ID"
                        )}
                      </div>

                      <div
                        className={`text-sm ${
                          margin.persen < 0
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {margin.persen.toFixed(1)}%
                      </div>

                    </td>

                    {/* =================================================
                        ===== UPDATE END: WH-PRODUK-MARGIN-001 =====
                    ================================================= */}

                    {/* =========================
                        STOK
                    ========================= */}

                    <td className="px-6 py-4 font-medium">
                      {item.stok}
                    </td>

                    {/* =========================
                        STATUS STOK
                    ========================= */}

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusStok.className}`}
                      >
                        {statusStok.label}
                      </span>

                    </td>

                    {/* =========================
                        AKSI
                    ========================= */}

                    <td className="px-6 py-4">

                      <div className="flex gap-2">

                        {/* =========================
                            EDIT
                        ========================= */}

                        <button
                          onClick={() =>
                            mulaiEdit(item)
                          }
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        {/* =========================
                            HAPUS
                        ========================= */}

                        <button
                          onClick={() =>
                            handleHapus(item)
                          }
                          disabled={
                            deletingId === item.id
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === item.id
                            ? "Menghapus..."
                            : "Hapus"}
                        </button>

                      </div>

                    </td>

                  </tr>
                );
              })

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

// ===== UPDATE END: WH-REFACTOR-PRODUK-002B-FINAL =====
