import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

export async function kurangiStokProduk(
  productId: number,
  jumlah: number
) {
  const { data: produk, error: errorAmbil } = await supabase
    .from("products")
    .select("id, stok")
    .eq("id", productId)
    .single();

  if (errorAmbil || !produk) {
    return {
      data: null,
      error: errorAmbil || new Error("Produk tidak ditemukan."),
    };
  }

  const stokSekarang = Number(produk.stok ?? 0);

  if (jumlah <= 0) {
    return {
      data: null,
      error: new Error("Jumlah pengurangan stok harus lebih dari 0."),
    };
  }

  if (stokSekarang < jumlah) {
    return {
      data: null,
      error: new Error(
        `Stok tidak cukup. Stok tersedia: ${stokSekarang}.`
      ),
    };
  }

  const stokBaru = stokSekarang - jumlah;

  const { data, error } = await supabase
    .from("products")
    .update({
      stok: stokBaru,
    })
    .eq("id", productId)
    .select()
    .single();

  return { data, error };
}
