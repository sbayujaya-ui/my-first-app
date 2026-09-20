type ProdukInfoProps = {
  jumlahHasil: number;
  jumlahTotal: number;
  searchProduk: string;
};

export default function ProdukInfo({
  jumlahHasil,
  jumlahTotal,
  searchProduk,
}: ProdukInfoProps) {
  return (
    <>
      {/* =========================
          INFORMASI HASIL
      ========================= */}

      <div className="mt-4 text-sm text-gray-500">

        {searchProduk.trim() ? (
          <>
            Hasil pencarian:{" "}
            <strong>
              {jumlahHasil}
            </strong>{" "}
            produk
          </>
        ) : (
          <>
            Total produk:{" "}
            <strong>
              {jumlahTotal}
            </strong>
          </>
        )}

      </div>

      {/* =========================
          KETERANGAN STATUS STOK
      ========================= */}

      <div className="mt-3 flex flex-wrap gap-3 text-sm">

        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
          🟢 Normal: &gt; 5
        </span>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
          🟠 Menipis: 1–5
        </span>

        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
          🔴 Habis: 0
        </span>

      </div>
    </>
  );
}