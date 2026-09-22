with daily as (
    select
        date_trunc('day', s.tanggal) as periode,
        count(*) as jumlah_transaksi,
        coalesce(sum(si.total_qty), 0) as total_qty,
        coalesce(sum(s.total), 0) as omzet
    from public.sales s
    left join (
        select
            sale_id,
            sum(jumlah) as total_qty
        from public.sale_items
        group by sale_id
    ) si
        on si.sale_id = s.id
    where s.tanggal >= date_trunc('month', now())
      and s.tanggal < date_trunc('month', now()) + interval '1 month'
    group by date_trunc('day', s.tanggal)
),

monthly as (
    select
        count(*) as jumlah_transaksi,
        coalesce(sum(s.total), 0) as omzet
    from public.sales s
    where s.tanggal >= date_trunc('month', now())
      and s.tanggal < date_trunc('month', now()) + interval '1 month'
),

items_monthly as (
    select
        coalesce(sum(si.jumlah), 0) as total_qty,
        coalesce(sum(si.subtotal), 0) as total_subtotal,
        coalesce(
            sum(
                coalesce(si.harga_beli, 0)
                * coalesce(si.jumlah, 0)
            ),
            0
        ) as total_historical_cost
    from public.sale_items si
    join public.sales s
        on s.id = si.sale_id
    where s.tanggal >= date_trunc('month', now())
      and s.tanggal < date_trunc('month', now()) + interval '1 month'
),

daily_rollup as (
    select
        coalesce(sum(jumlah_transaksi), 0) as daily_transactions,
        coalesce(sum(total_qty), 0) as daily_qty,
        coalesce(sum(omzet), 0) as daily_omzet
    from daily
)

select
    m.jumlah_transaksi as monthly_transactions,
    d.daily_transactions,

    i.total_qty as monthly_qty,
    d.daily_qty,

    m.omzet as monthly_omzet,
    d.daily_omzet,

    i.total_subtotal as monthly_item_subtotal,

    i.total_historical_cost as monthly_historical_cost,

    i.total_subtotal - i.total_historical_cost
        as monthly_gross_profit,

    m.jumlah_transaksi - d.daily_transactions
        as transaction_difference,

    i.total_qty - d.daily_qty
        as quantity_difference,

    m.omzet - d.daily_omzet
        as omzet_difference,

    m.omzet - i.total_subtotal
        as monthly_omzet_vs_item_subtotal_difference,

    case
        when m.jumlah_transaksi = d.daily_transactions
         and i.total_qty = d.daily_qty
         and m.omzet = d.daily_omzet
         and m.omzet = i.total_subtotal
        then 'PASS'
        else 'FAILED'
    end as audit_status

from monthly m
cross join items_monthly i
cross join daily_rollup d;


with report_sales as (
    select
        s.id,
        s.tanggal,
        s.total
    from public.sales s
    where s.tanggal >= date_trunc('month', now())
      and s.tanggal < date_trunc('month', now()) + interval '1 month'
),

item_sales as (
    select distinct
        si.sale_id
    from public.sale_items si
    join public.sales s
        on s.id = si.sale_id
    where s.tanggal >= date_trunc('month', now())
      and s.tanggal < date_trunc('month', now()) + interval '1 month'
)

select
    count(*) filter (
        where i.sale_id is null
    ) as sales_without_items,

    count(*) filter (
        where r.id is null
    ) as orphan_item_sales,

    count(*) as monthly_sales,

    case
        when count(*) filter (where i.sale_id is null) = 0
         and count(*) filter (where r.id is null) = 0
        then 'PASS'
        else 'FAILED'
    end as transaction_completeness_status

from report_sales r
full outer join item_sales i
    on i.sale_id = r.id;


select
    count(*) as total_sales_all_time,
    count(*) filter (
        where tanggal >= date_trunc('month', now())
          and tanggal < date_trunc('month', now()) + interval '1 month'
    ) as current_month_sales,
    count(*) filter (
        where tanggal >= date_trunc('day', now())
    ) as today_sales
from public.sales;
