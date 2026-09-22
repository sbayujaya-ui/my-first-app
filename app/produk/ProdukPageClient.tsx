"use client";

import { useEffect, useState } from "react";

import ProdukHeader from "../components/produk/ProdukHeader";
import ProdukActions from "../components/produk/ProdukActions";
import ProdukSearch from "../components/produk/ProdukSearch";
import ProdukForm from "../components/produk/ProdukForm";
import ProdukStockForm from "../components/produk/ProdukStockForm";
import ProdukTable from "../components/produk/ProdukTable";
import ProdukInfo from "../components/produk/ProdukInfo";

import { createClient } from "../../utils/supabase/client";
import {
  hasPermission,
  type UserRole,
} from "../../lib/auth/permissions";

import {
  ambilSemuaProduk,
  tambahProdukDenganStokAwal,
  updateProduk,
  hapusProduk,
} from "../../lib/produk/produkService";

import { tambahStokProduk } from "../../lib/produk/produkStockService";

type Produk = {
  id: number;
  kode: string;
  nama: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
};

export default function ProdukPage() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  const [searchProduk, setSearchProduk] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [namaProduk, setNamaProduk] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [stokAwal, setStokAwal] = useState("");

  const [showStockForm, setShowStockForm] = useState(false);
  const [stockProductId, setStockProductId] = useState<number | null>(null);
  const [stockProductName, setStockProductName] = useState("");
  const [stockCurrent, setStockCurrent] = useState(0);
  const [stockJumlah, setStockJumlah] = useState("");
  const [stockKeterangan, setStockKeterangan] = useState("");

  const [saving, setSaving] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canManage =
    role !== null && hasPermission(role, "produk.manage");

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (
        profile?.role === "admin" ||
        profile?.role === "kasir"
      ) {
        setRole(profile.role);
      } else {
        setRole(null);
      }
    }

    loadRole();
  }, []);

  const ambilProduk = async () => {
    setLoading(true);

    const { data, error } = await ambilSemuaProduk();

    if (error) {
      console.error("Gagal mengambil produk:", error.message);
      alert("Gagal mengambil data produk: " + error.message);
      setLoading(false);
      return;
    }

    if (data) {
      const dataProduk: Produk[] = data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        hargaBeli: Number(item.harga_beli),
        hargaJual: Number(item.harga_jual),
        stok: Number(item.stok),
      }));

      setProduk(dataProduk);
    } else {
      setProduk([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    ambilProduk();
  }, []);

  const generateKodeProduk = () => {
    let nomorTerbesar = 0;

    produk.forEach((item) => {
      const match = item.kode.match(/^P(\d+)$/);

      if (match) {
        const nomor = Number(match[1]);

        if (nomor > nomorTerbesar) {
          nomorTerbesar = nomor;
        }
      }
    });

    return `P${String(nomorTerbesar + 1).padStart(3, "0")}`;
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setNamaProduk("");
    setHargaBeli("");
    setHargaJual("");
    setStokAwal("");
  };

  const resetStockForm = () => {
    setShowStockForm(false);
    setStockProductId(null);
    setStockProductName("");
    setStockCurrent(0);
    setStockJumlah("");
    setStockKeterangan("");
  };

  const mulaiEdit = (item: Produk) => {
    if (!canManage) {
      return;
    }

    resetStockForm();

    setEditId(item.id);
    setNamaProduk(item.nama);
    setHargaBeli(String(item.hargaBeli));
    setHargaJual(String(item.hargaJual));
    setStokAwal("");
    setShowForm(true);
  };

  const mulaiTambahStok = (item: Produk) => {
    if (!canManage) {
      return;
    }

    resetForm();

    setStockProductId(item.id);
    setStockProductName(item.nama);
    setStockCurrent(item.stok);
    setStockJumlah("");
    setStockKeterangan("");
    setShowStockForm(true);
  };

  const handleSimpan = async () => {
    if (!canManage) {
      return;
    }

    const nama = namaProduk.trim();
    const beli = Number(hargaBeli);
    const jual = Number(hargaJual);

    if (!nama) {
      alert("Nama produk wajib diisi.");
      return;
    }

    if (!Number.isFinite(beli) || beli < 0) {
      alert("Harga beli tidak valid.");
      return;
    }

    if (!Number.isFinite(jual) || jual < 0) {
      alert("Harga jual tidak valid.");
      return;
    }

    if (jual < beli) {
      const lanjut = window.confirm(
        "Harga jual lebih rendah daripada harga beli.\n\nLanjutkan menyimpan?"
      );

      if (!lanjut) {
        return;
      }
    }

    const jumlahStokAwal = Number(stokAwal);

    if (
      editId === null &&
      (!Number.isInteger(jumlahStokAwal) || jumlahStokAwal < 0)
    ) {
      alert("Stok awal harus berupa angka bulat 0 atau lebih.");
      return;
    }

    setSaving(true);

    try {
      if (editId !== null) {
        const { error } = await updateProduk(editId, {
          nama,
          harga_beli: beli,
          harga_jual: jual,
        });

        if (error) {
          console.error("Gagal mengubah produk:", error.message);
          alert("Gagal mengubah produk: " + error.message);
          return;
        }

        alert("Produk berhasil diubah.");

        resetForm();
        await ambilProduk();

        return;
      }

      const kode = generateKodeProduk();

      const kodeSudahAda = produk.some(
        (item) =>
          item.kode.toLowerCase() === kode.toLowerCase()
      );

      if (kodeSudahAda) {
        alert(
          `Kode produk ${kode} sudah digunakan.\nSilakan muat ulang data produk dan coba lagi.`
        );
        return;
      }

      const { error } = await tambahProdukDenganStokAwal({
        kode,
        nama,
        harga_beli: beli,
        harga_jual: jual,
        stok_awal: jumlahStokAwal,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("duplicate") ||
          error.message.toLowerCase().includes("unique")
        ) {
          alert(
            `Kode produk ${kode} sudah digunakan.\nSilakan coba simpan kembali.`
          );
        } else {
          console.error("Gagal menambah produk:", error.message);
          alert("Gagal menambah produk: " + error.message);
        }

        return;
      }

      alert(`Produk berhasil ditambahkan dengan kode ${kode}.`);

      resetForm();
      await ambilProduk();
    } finally {
      setSaving(false);
    }
  };

  const handleTambahStok = async () => {
    if (!canManage) {
      return;
    }

    if (stockProductId === null) {
      alert("Produk belum dipilih.");
      return;
    }

    const jumlah = Number(stockJumlah);

    if (!Number.isInteger(jumlah) || jumlah <= 0) {
      alert("Jumlah stok masuk harus berupa angka bulat lebih dari 0.");
      return;
    }

    setStockSaving(true);

    try {
      const { error } = await tambahStokProduk(
        stockProductId,
        jumlah,
        stockKeterangan.trim() || undefined
      );

      if (error) {
        console.error("Gagal menambah stok:", error.message);
        alert("Gagal menambah stok: " + error.message);
        return;
      }

      alert(
        `Stok ${stockProductName} berhasil ditambah ${jumlah}.`
      );

      resetStockForm();
      await ambilProduk();
    } finally {
      setStockSaving(false);
    }
  };

  const handleHapus = async (item: Produk) => {
    if (!canManage) {
      return;
    }

    const konfirmasi = window.confirm(
      `Hapus produk "${item.nama}" (${item.kode})?\n\nData yang sudah dihapus tidak dapat dikembalikan.`
    );

    if (!konfirmasi) {
      return;
    }

    setDeletingId(item.id);

    try {
      const { error } = await hapusProduk(item.id);

      if (error) {
        console.error("Gagal menghapus produk:", error.message);

        if (
          error.message.toLowerCase().includes("foreign key") ||
          error.message.toLowerCase().includes("sale_items")
        ) {
          alert(
            "Produk tidak dapat dihapus karena sudah digunakan dalam transaksi penjualan."
          );
        } else {
          alert("Gagal menghapus produk: " + error.message);
        }

        return;
      }

      alert("Produk berhasil dihapus.");

      await ambilProduk();
    } finally {
      setDeletingId(null);
    }
  };

  const produkTersaring = produk.filter((item) => {
    const kataPencarian = searchProduk.trim().toLowerCase();

    if (!kataPencarian) {
      return true;
    }

    return (
      item.kode.toLowerCase().includes(kataPencarian) ||
      item.nama.toLowerCase().includes(kataPencarian)
    );
  });

  const jumlahTotal = produk.length;
  const jumlahHasil = produkTersaring.length;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <ProdukHeader />

        <ProdukActions
          showForm={showForm || showStockForm}
          setShowForm={setShowForm}
          canManage={canManage}
        />

        <ProdukForm
          showForm={showForm && canManage}
          editId={editId}
          namaProduk={namaProduk}
          setNamaProduk={setNamaProduk}
          hargaBeli={hargaBeli}
          setHargaBeli={setHargaBeli}
          hargaJual={hargaJual}
          setHargaJual={setHargaJual}
          stokAwal={stokAwal}
          setStokAwal={setStokAwal}
          saving={saving}
          handleSimpan={handleSimpan}
          resetForm={resetForm}
        />

        <ProdukStockForm
          show={showStockForm && canManage}
          namaProduk={stockProductName}
          stokSekarang={stockCurrent}
          jumlah={stockJumlah}
          setJumlah={setStockJumlah}
          keterangan={stockKeterangan}
          setKeterangan={setStockKeterangan}
          saving={stockSaving}
          handleSimpan={handleTambahStok}
          resetForm={resetStockForm}
        />

        <ProdukSearch
          searchProduk={searchProduk}
          setSearchProduk={setSearchProduk}
          jumlahHasil={jumlahHasil}
          jumlahTotal={jumlahTotal}
        />

        <ProdukTable
          loading={loading}
          produkTersaring={produkTersaring}
          searchProduk={searchProduk}
          mulaiEdit={mulaiEdit}
          mulaiTambahStok={mulaiTambahStok}
          handleHapus={handleHapus}
          deletingId={deletingId}
          canManage={canManage}
        />

        <ProdukInfo
          jumlahHasil={jumlahHasil}
          jumlahTotal={jumlahTotal}
          searchProduk={searchProduk}
        />
      </div>
    </main>
  );
}
