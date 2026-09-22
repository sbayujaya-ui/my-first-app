select
    count(distinct s.id) as transaksi,

    coalesce(sum(si.jumlah), 0) as quantity,

    coalesce(sum(si.subtotal), 0) as omzet,

    coalesce(
        sum(
            coalesce(si.harga_beli, 0)
            * coalesce(si.jumlah, 0)
        ),
        0
    ) as historical_cost,

    coalesce(sum(si.subtotal), 0)
    -
    coalesce(
        sum(
            coalesce(si.harga_beli, 0)
            * coalesce(si.jumlah, 0)
        ),
        0
    ) as gross_profit,

    case
        when coalesce(sum(si.subtotal), 0)
             =
             coalesce(
                 sum(
                     coalesce(si.harga, 0)
                     * coalesce(si.jumlah, 0)
                 ),
                 0
             )
        then 'PASS'
        else 'FAILED'
    end as selling_price_formula_status,

    case
        when coalesce(sum(si.subtotal), 0)
             -
             coalesce(
                 sum(
                     coalesce(si.harga_beli, 0)
                     * coalesce(si.jumlah, 0)
                 ),
                 0
             )
             =
             coalesce(sum(si.subtotal), 0)
             -
             coalesce(
                 sum(
                     coalesce(si.harga_beli, 0)
                     * coalesce(si.jumlah, 0)
                 ),
                 0
             )
        then 'PASS'
        else 'FAILED'
    end as profit_formula_status

from public.sales s
join public.sale_items si
    on si.sale_id = s.id
where s.tanggal >= date_trunc('month', now())
  and s.tanggal < date_trunc('month', now()) + interval '1 month';
