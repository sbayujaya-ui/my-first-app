-- SEC-009 PHASE 6
-- AUDIT E - SALE ITEM INTEGRITY
-- READ ONLY

select
  count(*) as total_sale_items,

  count(*) filter (
    where harga_beli is null
       or harga_beli < 0
  ) as invalid_harga_beli,

  count(*) filter (
    where harga is null
       or harga < 0
  ) as invalid_harga_jual,

  count(*) filter (
    where jumlah is null
       or jumlah <= 0
  ) as invalid_jumlah,

  count(*) filter (
    where subtotal is null
       or subtotal <> harga * jumlah
  ) as invalid_subtotal,

  count(*) filter (
    where sale_id is null
  ) as null_sale_id,

  count(*) filter (
    where product_id is null
  ) as null_product_id

from public.sale_items;
