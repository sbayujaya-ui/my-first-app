-- ============================================================
-- SEC-010 PRODUCT WRITE HARDENING
-- ============================================================
--
-- Purpose:
--   1. Move product UPDATE/DELETE from direct table DML to
--      SECURITY DEFINER RPC functions.
--   2. Keep authorization enforced through public.is_admin().
--   3. Remove direct client write privileges from application
--      tables while preserving authenticated SELECT access.
--
-- Application write paths:
--   update_produk()
--   hapus_produk()
--   tambah_produk_dengan_stok_awal()
--   tambah_stok_produk()
--   buat_transaksi_penjualan()
--
-- ============================================================


-- ============================================================
-- 1. PRODUCT UPDATE RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_produk(
    p_id bigint,
    p_nama text,
    p_harga_beli numeric,
    p_harga_jual numeric
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_product public.products;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION
            'Akses ditolak. Hanya admin yang dapat mengubah produk.';
    END IF;

    IF p_id IS NULL OR p_id <= 0 THEN
        RAISE EXCEPTION
            'ID produk tidak valid.';
    END IF;

    IF p_nama IS NULL OR btrim(p_nama) = '' THEN
        RAISE EXCEPTION
            'Nama produk wajib diisi.';
    END IF;

    IF p_harga_beli IS NULL OR p_harga_beli < 0 THEN
        RAISE EXCEPTION
            'Harga beli tidak valid.';
    END IF;

    IF p_harga_jual IS NULL OR p_harga_jual < 0 THEN
        RAISE EXCEPTION
            'Harga jual tidak valid.';
    END IF;

    UPDATE public.products
    SET
        nama = btrim(p_nama),
        harga_beli = p_harga_beli,
        harga_jual = p_harga_jual
    WHERE id = p_id
    RETURNING * INTO v_product;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Produk dengan ID % tidak ditemukan.', p_id;
    END IF;

    RETURN v_product;
END;
$function$;


-- ============================================================
-- 2. PRODUCT DELETE RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.hapus_produk(
    p_id bigint
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_product public.products;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION
            'Akses ditolak. Hanya admin yang dapat menghapus produk.';
    END IF;

    IF p_id IS NULL OR p_id <= 0 THEN
        RAISE EXCEPTION
            'ID produk tidak valid.';
    END IF;

    DELETE FROM public.products
    WHERE id = p_id
    RETURNING * INTO v_product;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Produk dengan ID % tidak ditemukan.', p_id;
    END IF;

    RETURN v_product;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION
            'Produk tidak dapat dihapus karena masih memiliki riwayat transaksi atau pergerakan stok.';
END;
$function$;


-- ============================================================
-- 3. RPC EXECUTE PRIVILEGES
-- ============================================================

REVOKE EXECUTE
ON FUNCTION public.update_produk(
    bigint,
    text,
    numeric,
    numeric
)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.update_produk(
    bigint,
    text,
    numeric,
    numeric
)
TO authenticated;


REVOKE EXECUTE
ON FUNCTION public.hapus_produk(bigint)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.hapus_produk(bigint)
TO authenticated;


-- ============================================================
-- 4. DIRECT TABLE WRITE HARDENING
-- ============================================================

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.products
FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.sales
FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.sale_items
FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.stock_movements
FROM anon, authenticated;


-- ============================================================
-- END SEC-010
-- ============================================================
