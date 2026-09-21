CREATE OR REPLACE FUNCTION public.tambah_stok_produk(
  p_product_id bigint,
  p_quantity integer,
  p_keterangan text DEFAULT NULL
)
RETURNS public.stock_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_product public.products;
  v_stock_before integer;
  v_stock_after integer;
  v_movement public.stock_movements;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menambah stok.';
  END IF;

  IF p_product_id IS NULL OR p_product_id <= 0 THEN
    RAISE EXCEPTION 'ID produk tidak valid.';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Jumlah stok masuk harus lebih dari 0.';
  END IF;

  SELECT *
  INTO STRICT v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  v_stock_before := COALESCE(v_product.stok, 0);
  v_stock_after := v_stock_before + p_quantity;

  UPDATE public.products
  SET stok = v_stock_after
  WHERE id = p_product_id;

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
    p_product_id,
    'IN',
    p_quantity,
    v_stock_before,
    v_stock_after,
    'STOCK_IN',
    NULL,
    COALESCE(p_keterangan, 'Penambahan stok oleh admin'),
    auth.uid()
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$function$;

REVOKE ALL ON FUNCTION public.tambah_stok_produk(bigint, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tambah_stok_produk(bigint, integer, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.tambah_stok_produk(bigint, integer, text) TO authenticated;
