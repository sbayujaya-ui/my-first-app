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
    .select("id,sale_id,product_id,harga,jumlah,subtotal")
    .eq("sale_id", saleId)
    .order("id", { ascending: true });
}

// ===== UPDATE END: WH-PENJUALAN-SERVICE-001 =====
// =====================================================
// TRANSAKSI ATOMIC VIA RPC
// =====================================================

export async function buatTransaksiPenjualan(data: {
  items: Array<{
    product_id: number;
    jumlah: number;
  }>;
  pembayaran: number;
}) {
  return await supabase.rpc("buat_transaksi_penjualan", {
    p_items: data.items,
    p_pembayaran: data.pembayaran,
  });
}
