import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

export async function tambahStokProduk(
  productId: number,
  jumlah: number,
  keterangan?: string
) {
  return await supabase.rpc("tambah_stok_produk", {
    p_product_id: productId,
    p_quantity: jumlah,
    p_keterangan: keterangan ?? null,
  });
}
