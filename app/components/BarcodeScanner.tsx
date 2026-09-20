"use client";

import { useRef, useState } from "react";

type Props = {
  onDetected?: (code: string) => void;
};

export default function BarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [active, setActive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState("Masukkan kode atau buka kamera.");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Kamera tidak didukung browser ini.");
      return;
    }

    if (!("BarcodeDetector" in window)) {
      setStatus(
        "BarcodeDetector belum didukung browser ini. Gunakan kode manual."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        stopCamera();
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setActive(true);
      setStatus("Kamera aktif. Arahkan ke barcode.");

      const Detector = (
        window as typeof window & {
          BarcodeDetector?: new (options?: {
            formats?: string[];
          }) => {
            detect(
              video: HTMLVideoElement
            ): Promise<Array<{ rawValue?: string }>>;
          };
        }
      ).BarcodeDetector;

      if (!Detector) {
        setStatus("BarcodeDetector tidak tersedia.");
        stopCamera();
        return;
      }

      const detector = new Detector({
        formats: [
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "code_128",
          "code_39",
          "qr_code",
        ],
      });

      const scan = async () => {
        if (!videoRef.current || !active) return;

        try {
          const results = await detector.detect(videoRef.current);

          const code = results
            .map((item) => String(item.rawValue ?? "").trim())
            .find(Boolean);

          if (code) {
            setStatus("Barcode terbaca: " + code);
            onDetected?.(code);
            stopCamera();
            return;
          }
        } catch {
          // Abaikan frame yang gagal.
        }

        if (streamRef.current) {
          window.setTimeout(scan, 500);
        }
      };

      window.setTimeout(scan, 500);
    } catch {
      setStatus(
        "Kamera tidak dapat dibuka. Periksa izin kamera."
      );
      stopCamera();
    }
  }

  function submitManual() {
    const code = manualCode.trim();

    if (!code) {
      setStatus("Masukkan kode terlebih dahulu.");
      return;
    }

    setStatus("Kode terbaca: " + code);
    onDetected?.(code);
    setManualCode("");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">
        Scan Barcode
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        Gunakan kamera atau masukkan kode produk manual.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {!active ? (
          <button
            type="button"
            onClick={startCamera}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            📷 Buka Kamera
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Tutup Kamera
          </button>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-lg bg-slate-950">
        <video
          ref={videoRef}
          className={active ? "block h-64 w-full object-cover" : "hidden"}
          muted
          playsInline
        />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={manualCode}
          onChange={(event) => setManualCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submitManual();
            }
          }}
          placeholder="Contoh: P009"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={submitManual}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Cari
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-600">
        {status}
      </p>
    </section>
  );
}
