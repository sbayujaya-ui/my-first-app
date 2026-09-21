import {
  getPermissions,
  hasPermission,
  type Permission,
  type UserRole,
} from "../lib/auth/permissions";

const tests: Array<[UserRole, Permission, boolean]> = [
  ["admin", "dashboard", true],
  ["admin", "produk.view", true],
  ["admin", "produk.manage", true],
  ["admin", "penjualan", true],
  ["admin", "scan", true],
  ["admin", "laporan.riwayat", true],
  ["admin", "laporan.harian", true],
  ["admin", "laporan.bulanan", true],
  ["admin", "laporan.keuntungan", true],
  ["admin", "users.manage", true],

  ["kasir", "dashboard", true],
  ["kasir", "produk.view", true],
  ["kasir", "produk.manage", false],
  ["kasir", "penjualan", true],
  ["kasir", "scan", true],
  ["kasir", "laporan.riwayat", true],
  ["kasir", "laporan.harian", true],
  ["kasir", "laporan.bulanan", false],
  ["kasir", "laporan.keuntungan", false],
  ["kasir", "users.manage", false],
];

let failed = 0;

console.log("");
console.log("==================================================");
console.log(" SEC-002 PERMISSION CHECK");
console.log("==================================================");

for (const [role, permission, expected] of tests) {
  const actual = hasPermission(role, permission);

  if (actual === expected) {
    console.log(
      `✓ ${role} / ${permission} -> ${actual ? "ALLOW" : "DENY"}`
    );
  } else {
    console.log(
      `✗ ${role} / ${permission} -> EXPECTED ${
        expected ? "ALLOW" : "DENY"
      }, GOT ${actual ? "ALLOW" : "DENY"}`
    );

    failed++;
  }
}

console.log("");
console.log("==================================================");
console.log(" PERMISSION SUMMARY");
console.log("==================================================");

for (const role of ["admin", "kasir"] as const) {
  console.log(`${role}: ${getPermissions(role).length} permissions`);
}

console.log("");
console.log("==================================================");
console.log(" RESULT");
console.log("==================================================");

if (failed === 0) {
  console.log(`Passed : ${tests.length}`);
  console.log("Failed : 0");
  console.log("");
  console.log("✓ SEC-002 PERMISSION CHECK PASS");
  process.exit(0);
}

console.log(`Passed : ${tests.length - failed}`);
console.log(`Failed : ${failed}`);
console.log("");
console.log("✗ SEC-002 PERMISSION CHECK FAIL");
process.exit(1);