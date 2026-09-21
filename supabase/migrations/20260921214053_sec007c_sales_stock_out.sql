create unique index if not exists stock_movements_one_opening_stock_per_product
on public.stock_movements (product_id)
where reference_type = 'OPENING_STOCK';

CREATE OR REPLACE FUNCTION public.buat_transaksi_penjualan(
  p_items jsonb,
  p_pembayaran numeric
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_sale public.sales;
  v_product record;
  v_item record;
  v_total numeric := 0;
  v_kembalian numeric;
  v_stock_before integer;
  v_stock_after integer;
begin

  -- =====================================================
  -- 1. VALIDASI INPUT DASAR
  -- =====================================================

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Daftar item transaksi harus berupa array.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Transaksi tidak memiliki item.';
  end if;

  if p_pembayaran is null or p_pembayaran < 0 then
    raise exception 'Nilai pembayaran tidak valid.';
  end if;


  -- =====================================================
  -- 2. VALIDASI SETIAP ITEM
  -- =====================================================

  for v_item in
    select
      x.product_id,
      x.jumlah
    from jsonb_to_recordset(p_items)
      as x(product_id bigint, jumlah integer)
  loop

    if v_item.product_id is null
       or v_item.product_id <= 0 then
      raise exception 'ID produk tidak valid.';
    end if;

    if v_item.jumlah is null
       or v_item.jumlah <= 0 then
      raise exception 'Jumlah produk harus lebih dari 0.';
    end if;

  end loop;


  -- =====================================================
  -- 3. VALIDASI PRODUK + LOCK STOK
  -- =====================================================

  for v_item in
    select
      x.product_id,
      sum(x.jumlah)::integer as jumlah
    from jsonb_to_recordset(p_items)
      as x(product_id bigint, jumlah integer)
    group by x.product_id
    order by x.product_id
  loop

    select
      p.id,
      p.nama,
      p.harga_beli,
      p.harga_jual,
      coalesce(p.stok, 0) as stok
    into strict v_product
    from products p
    where p.id = v_item.product_id
    for update;

    if v_product.stok < v_item.jumlah then
      raise exception
        'Stok produk "%" tidak mencukupi. Stok tersedia: %, diminta: %.',
        v_product.nama,
        v_product.stok,
        v_item.jumlah;
    end if;

    if coalesce(v_product.harga_beli, 0) < 0 then
      raise exception
        'Harga beli produk "%" tidak valid.',
        v_product.nama;
    end if;

    if coalesce(v_product.harga_jual, 0) < 0 then
      raise exception
        'Harga jual produk "%" tidak valid.',
        v_product.nama;
    end if;

    v_total :=
      v_total +
      coalesce(v_product.harga_jual, 0) * v_item.jumlah;

  end loop;


  -- =====================================================
  -- 4. VALIDASI PEMBAYARAN
  -- =====================================================

  if p_pembayaran < v_total then
    raise exception
      'Pembayaran masih kurang. Total: %, pembayaran: %.',
      v_total,
      p_pembayaran;
  end if;

  v_kembalian := p_pembayaran - v_total;


  -- =====================================================
  -- 5. SIMPAN HEADER TRANSAKSI
  -- =====================================================

  insert into sales (
    total,
    pembayaran,
    kembalian
  )
  values (
    v_total,
    p_pembayaran,
    v_kembalian
  )
  returning * into v_sale;


  -- =====================================================
  -- 6. SIMPAN DETAIL TRANSAKSI
  -- =====================================================

  insert into sale_items (
    sale_id,
    product_id,
    harga_beli,
    harga,
    jumlah,
    subtotal
  )
  select
    v_sale.id,
    x.product_id,
    coalesce(p.harga_beli, 0),
    coalesce(p.harga_jual, 0),
    x.jumlah,
    coalesce(p.harga_jual, 0) * x.jumlah
  from (
    select
      product_id,
      sum(jumlah)::integer as jumlah
    from jsonb_to_recordset(p_items)
      as item(product_id bigint, jumlah integer)
    group by product_id
  ) x
  join products p
    on p.id = x.product_id;


  -- =====================================================
  -- 7. KURANGI STOK + CATAT STOCK MOVEMENT OUT
  -- =====================================================

  for v_item in
    select
      x.product_id,
      x.jumlah
    from (
      select
        product_id,
        sum(jumlah)::integer as jumlah
      from jsonb_to_recordset(p_items)
        as item(product_id bigint, jumlah integer)
      group by product_id
    ) x
    order by x.product_id
  loop

    select
      coalesce(stok, 0)
    into v_stock_before
    from products
    where id = v_item.product_id
    for update;

    v_stock_after := v_stock_before - v_item.jumlah;

    update products
    set stok = v_stock_after
    where id = v_item.product_id;

    insert into stock_movements (
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
    values (
      v_item.product_id,
      'OUT',
      -v_item.jumlah,
      v_stock_before,
      v_stock_after,
      'SALE',
      v_sale.id,
      'Stok keluar dari transaksi penjualan',
      auth.uid()
    );

  end loop;


  -- =====================================================
  -- 8. KEMBALIKAN TRANSAKSI
  -- =====================================================

  return v_sale;

end;
$function$;