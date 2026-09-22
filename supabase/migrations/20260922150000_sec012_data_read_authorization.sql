-- ============================================================
-- SEC-012 DATA READ AUTHORIZATION & RLS EXPOSURE HARDENING
-- ============================================================
--
-- Purpose:
--   Protect cost/profit data from direct authenticated reads.
--
-- Final intended boundary:
--   - Operational product reads: safe columns only.
--   - Operational sale_items reads: safe columns only.
--   - products.harga_beli: no anon/authenticated SELECT.
--   - sale_items.harga_beli: no anon/authenticated SELECT.
--   - Admin product cost read: protected RPC.
--   - Admin profit read: protected RPC.
--
-- NOTE:
--   These changes were already applied and audited against the
--   live database during SEC-012. This migration records the
--   intended final database state for reproducibility.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ADMIN PRODUCT READ RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.ambil_semua_produk_admin()
RETURNS SETOF public.products
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.*
  FROM public.products p
  WHERE public.is_admin();
$function$;


-- ============================================================
-- 2. ADMIN PROFIT DETAIL RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.ambil_detail_keuntungan_admin(
  p_awal timestamptz,
  p_akhir timestamptz
)
RETURNS TABLE (
  sale_id bigint,
  sale_tanggal timestamptz,
  product_id bigint,
  product_nama text,
  product_kode text,
  harga_beli numeric,
  harga numeric,
  jumlah integer,
  subtotal numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    s.id AS sale_id,
    s.tanggal AS sale_tanggal,
    si.product_id,
    p.nama AS product_nama,
    p.kode AS product_kode,
    si.harga_beli,
    si.harga,
    si.jumlah,
    si.subtotal
  FROM public.sales s
  INNER JOIN public.sale_items si
    ON si.sale_id = s.id
  LEFT JOIN public.products p
    ON p.id = si.product_id
  WHERE public.is_admin()
    AND s.tanggal >= p_awal
    AND s.tanggal < p_akhir
  ORDER BY si.id ASC;
$function$;


-- ============================================================
-- 3. RPC EXECUTE BOUNDARY
-- ============================================================

REVOKE EXECUTE
ON FUNCTION public.ambil_semua_produk_admin()
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.ambil_semua_produk_admin()
FROM anon;

GRANT EXECUTE
ON FUNCTION public.ambil_semua_produk_admin()
TO authenticated;


REVOKE EXECUTE
ON FUNCTION public.ambil_detail_keuntungan_admin(timestamptz,timestamptz)
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.ambil_detail_keuntungan_admin(timestamptz,timestamptz)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.ambil_detail_keuntungan_admin(timestamptz,timestamptz)
TO authenticated;


-- ============================================================
-- 4. PRODUCTS SAFE READ COLUMNS
-- ============================================================

REVOKE SELECT
ON TABLE public.products
FROM anon, authenticated;

GRANT SELECT (
  id,
  kode,
  nama,
  harga_jual,
  stok
)
ON TABLE public.products
TO authenticated;


-- ============================================================
-- 5. SALE_ITEMS SAFE READ COLUMNS
-- ============================================================

REVOKE SELECT
ON TABLE public.sale_items
FROM anon, authenticated;

GRANT SELECT (
  id,
  sale_id,
  product_id,
  harga,
  jumlah,
  subtotal
)
ON TABLE public.sale_items
TO authenticated;


-- ============================================================
-- 6. FINAL SECURITY DEFINER CONFIGURATION
-- ============================================================

ALTER FUNCTION public.ambil_semua_produk_admin()
SET search_path TO public;

ALTER FUNCTION public.ambil_detail_keuntungan_admin(
  timestamptz,
  timestamptz
)
SET search_path TO public;

COMMIT;
