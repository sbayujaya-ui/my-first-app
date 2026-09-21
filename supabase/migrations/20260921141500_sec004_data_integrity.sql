alter table public.products
  add constraint products_stok_nonnegative
  check (stok >= 0);

alter table public.products
  add constraint products_harga_beli_nonnegative
  check (harga_beli >= 0);

alter table public.products
  add constraint products_harga_jual_nonnegative
  check (harga_jual >= 0);

alter table public.sale_items
  add constraint sale_items_jumlah_positive
  check (jumlah > 0);

alter table public.sale_items
  add constraint sale_items_harga_nonnegative
  check (harga >= 0);

alter table public.sale_items
  add constraint sale_items_harga_beli_nonnegative
  check (harga_beli >= 0);

alter table public.sale_items
  add constraint sale_items_subtotal_nonnegative
  check (subtotal >= 0);

alter table public.sales
  add constraint sales_total_nonnegative
  check (total >= 0);

alter table public.sales
  add constraint sales_pembayaran_nonnegative
  check (pembayaran >= 0);

alter table public.sales
  add constraint sales_kembalian_nonnegative
  check (kembalian >= 0);
