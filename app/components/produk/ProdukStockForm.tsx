type ProdukStockFormProps = {
  show: boolean;
  namaProduk: string;
  stokSekarang: number;
  jumlah: string;
  setJumlah: (value: string) => void;
  keterangan: string;
  setKeterangan: (value: string) => void;
  saving: boolean;
  handleSimpan: () => void;
  resetForm: () => void;
};

export default function ProdukStockForm({
  show,
  namaProduk,
  stokSekarang,
  jumlah,
  setJumlah,
  keterangan,
  setKeterangan,
  saving,
  handleSimpan,
  resetForm,
}: ProdukStockFormProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold text-gray-900">
        Tambah Stok
      </h2>

      <div className="mt-2 text-sm text-gray-600">
        Produk: <span className="font-semibold text-gray-900">{namaProduk}</span>
      </div>

      <div className="mt-1 text-sm text-gray-600">
        Stok sekarang:{" "}
        <span className="font-semibold text-gray-900">
          {stokSekarang}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input
          type="number"
          min="1"
          placeholder="Jumlah Stok Masuk"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
        />

        <input
          type="text"
          placeholder="Keterangan (opsional)"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
        />
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={handleSimpan}
          disabled={saving}
          className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Tambah Stok"}
        </button>

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
