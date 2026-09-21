select
  count(*) as jumlah_produk,
  count(*) filter (where selisih <> 0) as jumlah_mismatch,
  case
    when count(*) filter (where selisih <> 0) = 0
    then 'PASS'
    else 'FAILED'
  end as status
from (
  select
    p.id,
    coalesce(p.stok, 0) as stok_produk,
    coalesce(sum(sm.quantity), 0) as stok_ledger,
    coalesce(p.stok, 0) - coalesce(sum(sm.quantity), 0) as selisih
  from public.products p
  left join public.stock_movements sm
    on sm.product_id = p.id
  group by p.id, p.stok
) audit;
