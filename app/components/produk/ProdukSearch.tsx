type ProdukSearchProps = {
  searchProduk: string;
  setSearchProduk: (value: string) => void;
  jumlahHasil: number;
  jumlahTotal: number;
};

export default function ProdukSearch({
  searchProduk,
  setSearchProduk,
  jumlahHasil,
  jumlahTotal,
}: ProdukSearchProps) {
  return (
    <div className="mb-6 rounded-2xl bg-white p-4 shadow">

      <div className="relative">

        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          🔎
        </span>

        <input
          type="text"
          placeholder="Cari produk berdasarkan kode atau nama..."
          value={searchProduk}
          onChange={(e) =>
            setSearchProduk(e.target.value)
          }
          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-500 outline-none focus:border-black"
        />

      </div>

      {searchProduk.trim() && (
        <p className="mt-3 text-sm text-gray-500">
          Menampilkan{" "}
          {jumlahHasil} dari{" "}
          {jumlahTotal} produk.
        </p>
      )}

    </div>
  );
}