// ===== UPDATE START: WH-PENJUALAN-SERVICE-001 =====

import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

// =====================================================
// AMBIL SEMUA TRANSAKSI PENJUALAN
// =====================================================

export async function ambilSemuaPenjualan() {
  return await supabase
    .from("sales")
    .select("*")
    .order("tanggal", { ascending: false });
}

// =====================================================
// AMBIL DETAIL ITEM PENJUALAN
// =====================================================

export async function ambilItemPenjualan(saleId: number) {
  return await supabase
    .from("sale_items")
    .select("*")
    .eq("sale_id", saleId)
    .order("id", { ascending: true });
}

// =====================================================
// SIMPAN TRANSAKSI PENJUALAN
// =====================================================

export async function tambahPenjualan(data: {
  tanggal?: string;
  total: number;
  pembayaran: number;
  kembalian: number;
}) {
  return await supabase
    .from("sales")
    .insert(data)
    .select()
    .single();
}

// =====================================================
// SIMPAN ITEM PENJUALAN
// =====================================================

export async function tambahItemPenjualan(data: {
  sale_id: number;
  product_id: number;
  harga_beli: number;
  harga: number;
  jumlah: number;
  subtotal: number;
}) {
  return await supabase
    .from("sale_items")
    .insert(data);
}

// ===== UPDATE END: WH-PENJUALAN-SERVICE-001 =====