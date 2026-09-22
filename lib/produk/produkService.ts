import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

export async function ambilSemuaProduk() {
  return await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
}

export async function tambahProdukDenganStokAwal(data: {
  kode: string;
  nama: string;
  harga_beli: number;
  harga_jual: number;
  stok_awal: number;
}) {
  return await supabase.rpc("tambah_produk_dengan_stok_awal", {
    p_kode: data.kode,
    p_nama: data.nama,
    p_harga_beli: data.harga_beli,
    p_harga_jual: data.harga_jual,
    p_stok_awal: data.stok_awal,
  });
}

export async function updateProduk(
  id: number,
  data: {
    nama: string;
    harga_beli: number;
    harga_jual: number;
  }
) {
  return await supabase.rpc("update_produk", {
    p_id: id,
    p_nama: data.nama,
    p_harga_beli: data.harga_beli,
    p_harga_jual: data.harga_jual,
  });
}

export async function hapusProduk(id: number) {
  return await supabase.rpc("hapus_produk", {
    p_id: id,
  });
}

