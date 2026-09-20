import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

export async function ambilRingkasanPenjualanHariIni() {
  /*
   * WARUNG HRD menggunakan WIB (UTC+7).
   *
   * Batas hari dihitung berdasarkan tanggal WIB,
   * kemudian dikonversi menjadi UTC untuk query Supabase.
   */

  const sekarang = new Date();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const bagianTanggal = formatter.formatToParts(sekarang);

  const tahun = Number(
    bagianTanggal.find((bagian) => bagian.type === "year")?.value
  );

  const bulan = Number(
    bagianTanggal.find((bagian) => bagian.type === "month")?.value
  );

  const hari = Number(
    bagianTanggal.find((bagian) => bagian.type === "day")?.value
  );

  /*
   * WIB = UTC+7.
   *
   * Awal hari WIB:
   * YYYY-MM-DD 00:00 WIB
   *
   * Dalam UTC:
   * YYYY-MM-DD 00:00 UTC - 7 jam
   */

  const awalHari = new Date(
    Date.UTC(tahun, bulan - 1, hari, -7, 0, 0, 0)
  );

  const akhirHari = new Date(
    Date.UTC(tahun, bulan - 1, hari + 1, -7, 0, 0, 0)
  );

  const { data, error } = await supabase
    .from("sales")
    .select("id, total, tanggal")
    .gte("tanggal", awalHari.toISOString())
    .lt("tanggal", akhirHari.toISOString())
    .order("tanggal", { ascending: false });

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const transaksi = data?.length ?? 0;

  const penjualan = (data ?? []).reduce(
    (total, item) => total + Number(item.total ?? 0),
    0
  );

  return {
    data: {
      penjualan,
      transaksi,
    },
    error: null,
  };
}
