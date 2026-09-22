with sales_month as (
    select
        count(*) as transaksi,
        coalesce(sum(total), 0) as revenue
    from public.sales
    where tanggal >= date_trunc('month', now())
      and tanggal < date_trunc('month', now()) + interval '1 month'
),

items_month as (
    select
        count(distinct si.sale_id) as transaksi,
        coalesce(sum(si.jumlah), 0) as quantity,
        coalesce(sum(si.subtotal), 0) as revenue,
        coalesce(
            sum(
                coalesce(si.harga_beli, 0)
                * coalesce(si.jumlah, 0)
            ),
            0
        ) as historical_cost
    from public.sale_items si
    join public.sales s
        on s.id = si.sale_id
    where s.tanggal >= date_trunc('month', now())
      and s.tanggal < date_trunc('month', now()) + interval '1 month'
)

select
    s.transaksi as sales_transactions,
    i.transaksi as item_transactions,

    s.revenue as sales_revenue,
    i.revenue as item_subtotal,

    i.quantity,
    i.historical_cost,

    i.revenue - i.historical_cost as gross_profit,

    s.transaksi - i.transaksi as transaction_difference,
    s.revenue - i.revenue as revenue_difference,

    case
        when s.transaksi = i.transaksi
         and s.revenue = i.revenue
        then 'PASS'
        else 'FAILED'
    end as audit_status

from sales_month s
cross join items_month i;
