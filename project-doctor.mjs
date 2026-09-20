import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const BACKUP_DIR = path.join(ROOT, ".doctor-backup");

const requiredFiles = [
  "app/page.tsx",
  "app/login/page.tsx",
  "app/produk/page.tsx",
  "app/penjualan/page.tsx",

  "app/components/produk/ProdukHeader.tsx",
  "app/components/produk/ProdukActions.tsx",
  "app/components/produk/ProdukSearch.tsx",
  "app/components/produk/ProdukForm.tsx",
  "app/components/produk/ProdukTable.tsx",
  "app/components/produk/ProdukInfo.tsx",

  "app/produk/penjualan/ProdukPenjualan.tsx",

  "lib/produk/produkService.ts",
  "lib/produk/produkUtils.ts",
  "lib/penjualan/penjualanService.ts",

  "utils/supabase/client.ts",
];

let problems = 0;
let fixes = 0;

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function backupFile(relativePath) {
  const source = path.join(ROOT, relativePath);
  const destination = path.join(BACKUP_DIR, relativePath);

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function readFile(relativePath) {
  return fs.readFileSync(
    path.join(ROOT, relativePath),
    "utf8"
  );
}

function writeFile(relativePath, content) {
  fs.writeFileSync(
    path.join(ROOT, relativePath),
    content,
    "utf8"
  );
}

function section(title) {
  console.log("");
  console.log("==================================================");
  console.log(` ${title}`);
  console.log("==================================================");
}

// ==================================================
// HEADER
// ==================================================

console.log("");
console.log("==================================================");
console.log(" WARUNG HRD PROJECT DOCTOR");
console.log("==================================================");
console.log(`Project: ${ROOT}`);

// ==================================================
// STRUCTURE CHECK
// ==================================================

section("STRUCTURE CHECK");

for (const file of requiredFiles) {
  if (fileExists(file)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file}`);
    problems++;
  }
}

// ==================================================
// DUPLICATE ROUTE CHECK
// ==================================================

section("ROUTE CHECK");

const unwantedPage = path.join(
  ROOT,
  "app",
  "produk",
  "penjualan",
  "page.tsx"
);

if (fs.existsSync(unwantedPage)) {
  console.log(
    "✗ app/produk/penjualan/page.tsx masih ada"
  );

  problems++;

  if (process.argv.includes("--fix")) {
    const relativePath =
      "app/produk/penjualan/page.tsx";

    backupFile(relativePath);
    fs.unlinkSync(unwantedPage);

    console.log(
      "✓ File duplicate route dihapus setelah backup"
    );

    fixes++;
  }
} else {
  console.log(
    "✓ Tidak ada duplicate route"
  );
}

// ==================================================
// PENJUALAN IMPORT CHECK
// ==================================================

section("PENJUALAN IMPORT CHECK");

const penjualanPage =
  "app/penjualan/page.tsx";

if (fileExists(penjualanPage)) {
  const content = readFile(penjualanPage);

  const correctImport =
    'import ProdukPenjualan from "../produk/penjualan/ProdukPenjualan";';

  const oldImport =
    'import ProdukPenjualan from "../components/produk/penjualan/ProdukPenjualan";';

  if (content.includes(oldImport)) {
    console.log(
      "✗ Import ProdukPenjualan masih salah"
    );

    problems++;

    if (process.argv.includes("--fix")) {
      backupFile(penjualanPage);

      writeFile(
        penjualanPage,
        content.replace(
          oldImport,
          correctImport
        )
      );

      console.log(
        "✓ Import ProdukPenjualan diperbaiki"
      );

      fixes++;
    }
  } else if (content.includes(correctImport)) {
    console.log(
      "✓ Import ProdukPenjualan benar"
    );
  } else {
    console.log(
      "⚠ Import ProdukPenjualan tidak ditemukan"
    );
  }
}

// ==================================================
// PRODUCT COMPONENT IMPORT CHECK
// ==================================================

section("PRODUCT COMPONENT IMPORT CHECK");

const produkPenjualan =
  "app/produk/penjualan/ProdukPenjualan.tsx";

if (fileExists(produkPenjualan)) {
  const content = readFile(produkPenjualan);

  const correctImport =
    'import { ambilSemuaProduk } from "../../../lib/produk/produkService";';

  const oldImport =
    'import { ambilSemuaProduk } from "../../../../lib/produk/produkService";';

  if (content.includes(oldImport)) {
    console.log(
      "✗ Import produkService masih salah"
    );

    problems++;

    if (process.argv.includes("--fix")) {
      backupFile(produkPenjualan);

      writeFile(
        produkPenjualan,
        content.replace(
          oldImport,
          correctImport
        )
      );

      console.log(
        "✓ Import produkService diperbaiki"
      );

      fixes++;
    }
  } else if (content.includes(correctImport)) {
    console.log(
      "✓ Import produkService benar"
    );
  } else {
    console.log(
      "⚠ Import produkService tidak ditemukan"
    );
  }
}

// ==================================================
// ENV CHECK
// ==================================================

section("ENVIRONMENT CHECK");

const envFile =
  path.join(ROOT, ".env.local");

if (fs.existsSync(envFile)) {
  const env =
    fs.readFileSync(envFile, "utf8");

  if (
    env.includes(
      "NEXT_PUBLIC_SUPABASE_URL="
    )
  ) {
    console.log(
      "✓ NEXT_PUBLIC_SUPABASE_URL tersedia"
    );
  } else {
    console.log(
      "✗ NEXT_PUBLIC_SUPABASE_URL tidak ditemukan"
    );

    problems++;
  }

  if (
    env.includes(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="
    )
  ) {
    console.log(
      "✓ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tersedia"
    );
  } else {
    console.log(
      "✗ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tidak ditemukan"
    );

    problems++;
  }
} else {
  console.log(
    "✗ .env.local tidak ditemukan"
  );

  problems++;
}

// ==================================================
// BUILD
// ==================================================

if (process.argv.includes("--build")) {
  section("NEXT.JS BUILD");

  try {
    execSync(
      "npm run build",
      {
        cwd: ROOT,
        stdio: "inherit",
      }
    );

    console.log("");
    console.log(
      "✓ Next.js build berhasil"
    );
  } catch {
    console.log("");
    console.log(
      "✗ Next.js build gagal"
    );

    problems++;
  }
}

// ==================================================
// RESULT
// ==================================================

section("RESULT");

console.log(
  `Problems found : ${problems}`
);

console.log(
  `Automatic fixes: ${fixes}`
);

if (problems === 0) {
  console.log("");
  console.log(
    "✓ PROJECT HEALTHY"
  );
} else if (
  process.argv.includes("--fix")
) {
  console.log("");
  console.log(
    "✓ Scan selesai dan perbaikan aman telah dilakukan."
  );
} else {
  console.log("");
  console.log(
    "⚠ Masalah ditemukan."
  );

  console.log(
    "Gunakan: npm run doctor:fix"
  );
}

console.log("");