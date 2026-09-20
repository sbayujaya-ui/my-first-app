// ===== UPDATE START: WH-REFACTOR-PRODUK-002C =====

import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

export async function ambilSemuaProduk() {
  return await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
}

export async function tambahProduk(data: {
  kode: string;
  nama: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
}) {
  return await supabase
    .from("products")
    .insert(data);
}

export async function updateProduk(
  id: number,
  data: {
    nama: string;
    harga_beli: number;
    harga_jual: number;
    stok: number;
  }
) {
  return await supabase
    .from("products")
    .update(data)
    .eq("id", id);
}

export async function hapusProduk(id: number) {
  return await supabase
    .from("products")
    .delete()
    .eq("id", id);
}

// ===== UPDATE END: WH-REFACTOR-PRODUK-002C =====
