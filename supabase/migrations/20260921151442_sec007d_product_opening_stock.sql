CREATE OR REPLACE FUNCTION public.tambah_produk_dengan_stok_awal(
  p_kode text,
  p_nama text,
  p_harga_beli numeric,
  p_harga_jual numeric,
  p_stok_awal integer
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
    RAISE EXCEPTION 'Hanya admin yang dapat menambah produk.';
  END IF;

  IF p_nama IS NULL OR btrim(p_nama) = '' THEN
    RAISE EXCEPTION 'Nama produk wajib diisi.';
  END IF;

  IF p_harga_beli IS NULL OR p_harga_beli < 0 THEN
    RAISE EXCEPTION 'Harga beli tidak valid.';
  END IF;

  IF p_harga_jual IS NULL OR p_harga_jual < 0 THEN
    RAISE EXCEPTION 'Harga jual tidak valid.';
  END IF;

  IF p_stok_awal IS NULL OR p_stok_awal < 0 THEN
    RAISE EXCEPTION 'Stok awal tidak valid.';
  END IF;

  INSERT INTO public.products (
    kode,
    nama,
    harga_beli,
    harga_jual,
    stok
  )
  VALUES (
    p_kode,
    btrim(p_nama),
    p_harga_beli,
    p_harga_jual,
    p_stok_awal
  )
  RETURNING * INTO v_product;

  IF p_stok_awal > 0 THEN
    INSERT INTO public.stock_movements (
      product_id,
      movement_type,
      quantity,
      stock_before,
      stock_after,
      reference_type,
      reference_id,
      keterangan,
      created_by
    )
    VALUES (
      v_product.id,
      'ADJUSTMENT',
      p_stok_awal,
      0,
      p_stok_awal,
      'OPENING_STOCK',
      NULL,
      'Stok awal saat produk dibuat',
      auth.uid()
    );
  END IF;

  RETURN v_product;
END;
$function$;

REVOKE ALL ON FUNCTION public.tambah_produk_dengan_stok_awal(text, text, numeric, numeric, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tambah_produk_dengan_stok_awal(text, text, numeric, numeric, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.tambah_produk_dengan_stok_awal(text, text, numeric, numeric, integer) TO authenticated;
