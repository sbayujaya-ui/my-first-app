import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const routes = [
  "/",
  "/login",
  "/produk",
  "/penjualan",
  "/scan",
  "/laporan",
  "/laporan/harian",
  "/laporan/bulanan",
  "/laporan/keuntungan",
];

const files = [
  "app/page.tsx",
  "app/login/page.tsx",
  "app/produk/page.tsx",
  "app/penjualan/page.tsx",
  "app/scan/page.tsx",
  "app/laporan/page.tsx",
  "app/laporan/harian/page.tsx",
  "app/laporan/bulanan/page.tsx",
  "app/laporan/keuntungan/page.tsx",
  "app/components/AppShell.tsx",
];

let problems = 0;

for (const file of files) {
  const full = path.join(root, file);

  if (!fs.existsSync(full)) {
    console.error("[FAIL] File tidak ditemukan:", file);
    problems++;
  } else {
    console.log("[OK] File:", file);
  }
}

const shell = fs.readFileSync(
  path.join(root, "app/components/AppShell.tsx"),
  "utf8"
);

for (const route of routes) {
  if (!shell.includes(`href: "${route}"`) && route !== "/login") {
    console.error("[FAIL] Route belum terhubung:", route);
    problems++;
  }
}

const layout = fs.readFileSync(
  path.join(root, "app/layout.tsx"),
  "utf8"
);

if (!layout.includes('import AppShell from "./components/AppShell";')) {
  console.error("[FAIL] AppShell belum diimport oleh layout.");
  problems++;
}

if (!layout.includes("<AppShell>{children}</AppShell>")) {
  console.error("[FAIL] Children belum dibungkus AppShell.");
  problems++;
}

if (problems > 0) {
  console.error(`UI SMOKE CHECK FAILED: ${problems} masalah.`);
  process.exit(1);
}

console.log("UI SMOKE CHECK PASSED.");
console.log("Semua route utama terhubung ke AppShell.");
