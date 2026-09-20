import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

export type DetailKeuntungan = {
  saleId: number;
  saleTanggal: string;
  productId: number;
  productNama: string;
  productKode: string;
  hargaBeli: number | null;
  hargaJual: number;
  jumlah: number;
  omzet: number;
  modal: number | null;
  keuntungan: number | null;
  marginPersen: number | null;
  hargaBeliTersedia: boolean;
};

export type RekapKeuntungan = {
  omzet: number;
  omzetDiketahui: number;
  modalDiketahui: number;
  keuntunganDiketahui: number;
  marginPersenDiketahui: number | null;
  transaksi: number;
  itemTerjual: number;
  itemDenganHargaBeli: number;
  itemTanpaHargaBeli: number;
  dataLengkap: boolean;
}

function buatRentangBulan(bulan: string) {
  const [tahun, nomorBulan] = bulan.split("-").map(Number);

  const awal = new Date(
    Date.UTC(tahun, nomorBulan - 1, 1, -7, 0, 0)
  );

  const akhir = new Date(
    Date.UTC(tahun, nomorBulan, 1, -7, 0, 0)
  );

  return {
    awal: awal.toISOString(),
    akhir: akhir.toISOString(),
  };
}

export async function ambilDetailKeuntungan(
  bulan: string
): Promise<{
  data: DetailKeuntungan[];
  error: Error | null;
}> {
  try {
    const { awal, akhir } = buatRentangBulan(bulan);

    const { data: sales, error: salesError } =
      await supabase
        .from("sales")
        .select("id, tanggal")
        .gte("tanggal", awal)
        .lt("tanggal", akhir)
        .order("tanggal", {
          ascending: false,
        });

    if (salesError) {
      return {
        data: [],
        error: new Error(salesError.message),
      };
    }

    if (!sales || sales.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const saleIds = sales.map((sale) => sale.id);

    const { data: items, error: itemsError } =
      await supabase
        .from("sale_items")
        .select(
          `
          id,
          sale_id,
          product_id,
          harga_beli,
          harga,
          jumlah,
          subtotal,
          products (
            nama,
            kode
          )
        `
        )
        .in("sale_id", saleIds)
        .order("id", {
          ascending: true,
        });

    if (itemsError) {
      return {
        data: [],
        error: new Error(itemsError.message),
      };
    }

    const tanggalBySale = new Map<number, string>();

    for (const sale of sales) {
      tanggalBySale.set(
        Number(sale.id),
        sale.tanggal
      );
    }

    const hasil: DetailKeuntungan[] = [];

    for (const item of items ?? []) {
      const hargaBeli =
        Number(item.harga_beli ?? 0);

      const hargaJual =
        Number(item.harga ?? 0);

      const jumlah =
        Number(item.jumlah ?? 0);

      const omzet =
        hargaJual * jumlah;

      const hargaBeliTersedia =
        Number.isFinite(hargaBeli) &&
        hargaBeli > 0;

      const modal =
        hargaBeliTersedia
          ? hargaBeli * jumlah
          : null;

      const keuntungan =
        modal !== null
          ? omzet - modal
          : null;

      const marginPersen =
        keuntungan !== null && omzet > 0
          ? (keuntungan / omzet) * 100
          : null;

      const produk = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      hasil.push({
        saleId: Number(item.sale_id),
        saleTanggal:
          tanggalBySale.get(
            Number(item.sale_id)
          ) ?? "",
        productId: Number(item.product_id),
        productNama:
          produk?.nama ?? "Produk tidak ditemukan",
        productKode:
          produk?.kode ?? "-",
        hargaBeli:
          hargaBeliTersedia
            ? hargaBeli
            : null,
        hargaJual,
        jumlah,
        omzet,
        modal,
        keuntungan,
        marginPersen,
        hargaBeliTersedia,
      });
    }

    return {
      data: hasil,
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error:
        error instanceof Error
          ? error
          : new Error(
              "Gagal mengambil data keuntungan."
            ),
    };
  }
}

export function hitungRekapKeuntungan(
  detail: DetailKeuntungan[]
): RekapKeuntungan {
  const omzet = detail.reduce(
    (total, item) => total + item.omzet,
    0
  );

  const transaksi = new Set(
    detail.map((item) => item.saleId)
  ).size;

  const itemTerjual = detail.reduce(
    (total, item) => total + item.jumlah,
    0
  );

  const diketahui = detail.filter(
    (item) => item.hargaBeliTersedia
  );

  const omzetDiketahui = diketahui.reduce(
    (total, item) => total + item.omzet,
    0
  );

  const modalDiketahui = diketahui.reduce(
    (total, item) => total + (item.modal ?? 0),
    0
  );

  const keuntunganDiketahui =
    omzetDiketahui - modalDiketahui;

  const marginPersenDiketahui =
    omzetDiketahui > 0
      ? (keuntunganDiketahui / omzetDiketahui) * 100
      : null;

  const itemDenganHargaBeli = diketahui.reduce(
    (total, item) => total + item.jumlah,
    0
  );

  const itemTanpaHargaBeli =
    itemTerjual - itemDenganHargaBeli;

  return {
    omzet,
    omzetDiketahui,
    modalDiketahui,
    keuntunganDiketahui,
    marginPersenDiketahui,
    transaksi,
    itemTerjual,
    itemDenganHargaBeli,
    itemTanpaHargaBeli,
    dataLengkap: itemTanpaHargaBeli === 0,
  };
}
