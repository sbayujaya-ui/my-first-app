"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import {
  hasPermission,
  type Permission,
  type UserRole,
} from "../../lib/auth/permissions";

type NavItem = {
  label: string;
  href: string;
  permission: Permission;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: "UTAMA",
    items: [
      {
        label: "Dashboard",
        href: "/",
        permission: "dashboard",
      },
    ],
  },
  {
    label: "PENJUALAN",
    items: [
      {
        label: "Penjualan",
        href: "/penjualan",
        permission: "penjualan",
      },
      {
        label: "Riwayat Penjualan",
        href: "/laporan",
        permission: "laporan.riwayat",
      },
    ],
  },
  {
    label: "PRODUK",
    items: [
      {
        label: "Produk",
        href: "/produk",
        permission: "produk.view",
      },
      {
        label: "Scan Barcode",
        href: "/scan",
        permission: "scan",
      },
    ],
  },
  {
    label: "LAPORAN",
    items: [
      {
        label: "Laporan Harian",
        href: "/laporan/harian",
        permission: "laporan.harian",
      },
      {
        label: "Laporan Bulanan",
        href: "/laporan/bulanan",
        permission: "laporan.bulanan",
      },
      {
        label: "Keuntungan",
        href: "/laporan/keuntungan",
        permission: "laporan.keuntungan",
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(href + "/");
}

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/penjualan") return "Penjualan";
  if (pathname === "/produk") return "Produk";
  if (pathname === "/scan") return "Scan Barcode";
  if (pathname === "/laporan") return "Riwayat Penjualan";
  if (pathname === "/laporan/harian") return "Laporan Harian";
  if (pathname === "/laporan/bulanan") return "Laporan Bulanan";
  if (pathname === "/laporan/keuntungan") return "Keuntungan";

  return "WARUNG HRD";
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </svg>
  );
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

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

      if (profile?.role === "admin" || profile?.role === "kasir") {
        setRole(profile.role);
      }
    }

    loadRole();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const supabase = createClient();

      await supabase.auth.signOut();

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("[AUTH] Logout gagal:", error);
      setLoggingOut(false);
    }
  }

  const visibleGroups = role
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            hasPermission(role, item.permission)
          ),
        }))
        .filter((group) => group.items.length > 0)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-[var(--wh-text)]">
      {/* =====================================================
          MOBILE HEADER
          ===================================================== */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--wh-border)] bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--wh-border)] bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-label="Buka menu navigasi"
          aria-expanded={open}
        >
          <MenuIcon />
        </button>

        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="text-sm font-bold tracking-tight text-slate-950"
        >
          WARUNG HRD
        </Link>

        <Link
          href="/penjualan"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm"
        >
          + Jual
        </Link>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}
      {open && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col",
          "border-r border-[var(--wh-border)] bg-white",
          "shadow-lg",
          "transition-transform duration-200 ease-out",
          open
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--wh-border)] px-5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="min-w-0"
          >
            <span className="block truncate text-base font-bold tracking-tight text-slate-950">
              WARUNG HRD
            </span>

            <span className="block truncate text-xs text-slate-500">
              Management System
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--wh-border)] text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Tutup menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Navigasi utama"
          className="flex-1 overflow-y-auto px-3 py-5"
        >
          <div className="space-y-6">
            {visibleGroups.map((group) => (
              <section key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
                  {group.label}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold transition-colors",
                          active
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-[var(--wh-border)] p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogoutIcon />

            <span>
              {loggingOut ? "Keluar..." : "Keluar"}
            </span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          DESKTOP APPLICATION AREA
          ===================================================== */}
      <div className="min-h-screen lg:pl-72">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-[var(--wh-border)] bg-white/95 px-6 backdrop-blur lg:flex">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              WARUNG HRD
            </p>

            <p className="truncate text-base font-bold text-slate-900">
              {getPageTitle(pathname)}
            </p>
          </div>

          <Link
            href="/penjualan"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Penjualan Baru
          </Link>
        </header>

        {/* =================================================
            CONTENT
            ================================================= */}
        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}