type ProdukFormProps = {
  showForm: boolean;
  editId: number | null;

  namaProduk: string;
  setNamaProduk: (value: string) => void;

  hargaBeli: string;
  setHargaBeli: (value: string) => void;

  hargaJual: string;
  setHargaJual: (value: string) => void;

  stok: string;
  setStok: (value: string) => void;

  saving: boolean;

  handleSimpan: () => void;
  resetForm: () => void;
};

export default function ProdukForm({
  showForm,
  editId,

  namaProduk,
  setNamaProduk,

  hargaBeli,
  setHargaBeli,

  hargaJual,
  setHargaJual,

  stok,
  setStok,

  saving,

  handleSimpan,
  resetForm,
}: ProdukFormProps) {
  if (!showForm) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow">

      {/* =========================
          JUDUL FORM
      ========================= */}

      <h2 className="text-xl font-bold text-gray-900">
        {editId !== null
          ? "Edit Produk"
          : "Tambah Produk"}
      </h2>

      {/* =========================
          INPUT PRODUK
      ========================= */}

      <div className="mt-4 grid gap-4 md:grid-cols-2">

        {/* Nama Produk */}

        <input
          type="text"
          placeholder="Nama Produk"
          value={namaProduk}
          onChange={(e) =>
            setNamaProduk(e.target.value)
          }
          className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
        />

        {/* Harga Beli */}

        <input
          type="number"
          placeholder="Harga Beli"
          value={hargaBeli}
          onChange={(e) =>
            setHargaBeli(e.target.value)
          }
          className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
        />

        {/* Harga Jual */}

        <input
          type="number"
          placeholder="Harga Jual"
          value={hargaJual}
          onChange={(e) =>
            setHargaJual(e.target.value)
          }
          className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
        />

        {/* Stok */}

        <input
          type="number"
          placeholder="Stok"
          value={stok}
          onChange={(e) =>
            setStok(e.target.value)
          }
          className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
        />

      </div>

      {/* =========================
          TOMBOL
      ========================= */}

      <div className="mt-4 flex gap-3">

        {/* Simpan */}

        <button
          onClick={handleSimpan}
          disabled={saving}
          className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {saving
            ? "Menyimpan..."
            : editId !== null
            ? "Simpan Perubahan"
            : "Simpan Produk"}
        </button>

        {/* Batal */}

        <button
          onClick={resetForm}
          disabled={saving}
          className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-gray-900 disabled:opacity-50"
        >
          Batal
        </button>

      </div>

    </div>
  );
}