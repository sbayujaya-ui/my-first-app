import { spawnSync } from "node:child_process";

console.log("");
console.log("=== INVENTORY AUDIT ===");
console.log("Target: Production Supabase");
console.log("Mode: READ-ONLY");
console.log("");

const result = spawnSync(
  "npx",
  [
    "supabase",
    "db",
    "query",
    "--linked",
    "--file",
    "scripts/inventory-audit.sql",
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: true,
  }
);

if (result.status !== 0) {
  console.error("AUDIT ERROR");
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const output = result.stdout.trim();

console.log(output);
console.log("");

const dataLine = output
  .split(/\r?\n/)
  .find((line) => /PASS|FAILED/.test(line));

if (!dataLine) {
  console.error("AUDIT ERROR");
  console.error("Baris hasil audit tidak ditemukan.");
  process.exit(1);
}

const numbers = dataLine.match(/\d+/g);

if (!numbers || numbers.length < 2) {
  console.error("AUDIT ERROR");
  console.error("Angka hasil audit tidak dapat dibaca.");
  process.exit(1);
}

const jumlahProduk = Number(numbers[0]);
const jumlahMismatch = Number(numbers[1]);
const status = dataLine.includes("PASS") ? "PASS" : "FAILED";

console.log(`Produk diperiksa : ${jumlahProduk}`);
console.log(`Mismatch         : ${jumlahMismatch}`);
console.log(`Status           : ${status}`);
console.log("");

if (status === "PASS" && jumlahMismatch === 0) {
  console.log("AUDIT PASS");
  console.log(
    `Semua ${jumlahProduk} produk sesuai dengan stok ledger.`
  );
  process.exit(0);
}

console.log("AUDIT FAILED");
console.log(
  `Ditemukan ${jumlahMismatch} produk dengan selisih stok.`
);
process.exit(1);
