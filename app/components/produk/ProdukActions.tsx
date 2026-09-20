type ProdukActionsProps = {
  showForm: boolean;
  setShowForm: (value: boolean) => void;
};

export default function ProdukActions({
  showForm,
  setShowForm,
}: ProdukActionsProps) {
  if (showForm) return null;

  return (
    <button
      onClick={() => setShowForm(true)}
      className="mb-6 rounded-lg bg-black px-5 py-3 text-white"
    >
      + Tambah Produk
    </button>
  );
}