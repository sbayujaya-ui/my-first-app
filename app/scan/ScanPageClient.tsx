"use client";

import { useState } from "react";
import Link from "next/link";
import BarcodeScanner from "../components/BarcodeScanner";

export default function ScanPage() {
  const [lastCode, setLastCode] = useState("");

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-xl">
        <Link
          href="/penjualan"
          className="text-sm font-medium text-blue-700"
        >
          ← Kembali ke Penjualan
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Scanner Barcode
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Uji kamera dan pembacaan barcode WARUNG HRD.
        </p>

        <div className="mt-5">
          <BarcodeScanner onDetected={setLastCode} />
        </div>

        {lastCode && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-medium text-green-700">
              Barcode terakhir terbaca
            </p>

            <p className="mt-1 text-xl font-bold text-green-900">
              {lastCode}
            </p>

            <p className="mt-1 text-xs text-green-700">
              Scanner berhasil membaca kode.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
