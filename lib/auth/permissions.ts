export type UserRole = "admin" | "kasir";

export type Permission =
  | "dashboard"
  | "produk.view"
  | "produk.manage"
  | "penjualan"
  | "scan"
  | "laporan.riwayat"
  | "laporan.harian"
  | "laporan.bulanan"
  | "laporan.keuntungan"
  | "users.manage";

const permissionsByRole: Record<UserRole, readonly Permission[]> = {
  admin: [
    "dashboard",
    "produk.view",
    "produk.manage",
    "penjualan",
    "scan",
    "laporan.riwayat",
    "laporan.harian",
    "laporan.bulanan",
    "laporan.keuntungan",
    "users.manage",
  ],

  kasir: [
    "dashboard",
    "produk.view",
    "penjualan",
    "scan",
    "laporan.riwayat",
    "laporan.harian",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return permissionsByRole[role].includes(permission);
}

export function getPermissions(role: UserRole): readonly Permission[] {
  return permissionsByRole[role];
}