type ProdukActionsProps = {
  showForm: boolean;
  setShowForm: (value: boolean) => void;
  canManage: boolean;
};

export default function ProdukActions({
  showForm,
  setShowForm,
  canManage,
}: ProdukActionsProps) {
  if (showForm || !canManage) return null;

  return (
    <button
      onClick={() => setShowForm(true)}
      className="mb-6 rounded-lg bg-black px-5 py-3 text-white"
    >
      + Tambah Produk
    </button>
  );
}
