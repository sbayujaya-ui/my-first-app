-- SEC-009 REPORTING INTEGRITY BASELINE
-- MODE: READ-ONLY
-- NO INSERT / UPDATE / DELETE

with sale_item_summary as (
    select
        count(distinct si.sale_id)::bigint as sales_with_items,
        count(*)::bigint as total_sale_items,
        coalesce(sum(si.jumlah), 0)::bigint as total_quantity,
        coalesce(sum(si.subtotal), 0)::numeric as total_item_subtotal,
        coalesce(
            sum(si.harga_beli * si.jumlah),
            0
        )::numeric as total_historical_cost,
        coalesce(
            sum(si.subtotal - (si.harga_beli * si.jumlah)),
            0
        )::numeric as total_gross_profit
    from public.sale_items si
),

sales_summary as (
    select
        count(*)::bigint as total_sales,
        coalesce(sum(s.total), 0)::numeric as total_sales_amount
    from public.sales s
),

sales_item_mismatch as (
    select
        count(*)::bigint as mismatch_count
    from public.sales s
    left join (
        select
            sale_id,
            sum(subtotal) as item_total
        from public.sale_items
        group by sale_id
    ) si
        on si.sale_id = s.id
    where coalesce(s.total, 0)
        <> coalesce(si.item_total, 0)
),

sales_without_items as (
    select
        count(*)::bigint as count_sales_without_items
    from public.sales s
    where not exists (
        select 1
        from public.sale_items si
        where si.sale_id = s.id
    )
),

orphan_sale_items as (
    select
        count(*)::bigint as orphan_count
    from public.sale_items si
    left join public.sales s
        on s.id = si.sale_id
    where s.id is null
),

invalid_profit_data as (
    select
        count(*)::bigint as invalid_count
    from public.sale_items si
    where si.harga_beli < 0
       or si.jumlah <= 0
       or si.subtotal < 0
),

daily_period as (
    select
        count(*)::bigint as daily_sales_count
    from public.sales
    where created_at >= date_trunc('day', now())
      and created_at < date_trunc('day', now()) + interval '1 day'
),

monthly_period as (
    select
        count(*)::bigint as monthly_sales_count
    from public.sales
    where created_at >= date_trunc('month', now())
      and created_at < date_trunc('month', now()) + interval '1 month'
)

select
    ss.total_sales,
    sis.sales_with_items,
    sis.total_sale_items,
    sis.total_quantity,

    ss.total_sales_amount,
    sis.total_item_subtotal,

    (ss.total_sales_amount - sis.total_item_subtotal)
        as sales_total_difference,

    sis.total_historical_cost,
    sis.total_gross_profit,

    sim.mismatch_count
        as sales_item_mismatch,

    swi.count_sales_without_items
        as sales_without_items,

    osi.orphan_count
        as orphan_sale_items,

    ipd.invalid_count
        as invalid_profit_data,

    dp.daily_sales_count,
    mp.monthly_sales_count,

    case
        when ss.total_sales = sis.sales_with_items
         and ss.total_sales_amount = sis.total_item_subtotal
         and sim.mismatch_count = 0
         and swi.count_sales_without_items = 0
         and osi.orphan_count = 0
         and ipd.invalid_count = 0
        then 'PASS'
        else 'FAILED'
    end as audit_status

from sales_summary ss
cross join sale_item_summary sis
cross join sales_item_mismatch sim
cross join sales_without_items swi
cross join orphan_sale_items osi
cross join invalid_profit_data ipd
cross join daily_period dp
cross join monthly_period mp;
