import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

export type ProdukAdminRead = {
  id: number;
  created_at: string;
  kode: string | null;
  nama: string | null;
  harga_beli: number | null;
  harga_jual: number | null;
  stok: number | null;
};

export async function ambilProdukOperasional() {
  return await supabase
    .from("products")
    .select("id,kode,nama,harga_jual,stok")
    .order("created_at", { ascending: true });
}

export async function ambilSemuaProdukAdmin() {
  const { data, error } = await supabase.rpc("ambil_semua_produk_admin");

  return {
    data: data as ProdukAdminRead[] | null,
    error,
  };
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
