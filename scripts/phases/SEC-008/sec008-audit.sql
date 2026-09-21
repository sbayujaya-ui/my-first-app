-- SEC-008 SALES & REPORTING INTEGRITY AUDIT
-- MODE: READ-ONLY
-- NO INSERT / UPDATE / DELETE

with ledger_activation as (
    select
        min(created_at) as activation_at
    from public.stock_movements
    where reference_type = 'OPENING_STOCK'
),

sale_qty as (
    select
        si.sale_id,
        si.product_id,
        sum(si.jumlah)::bigint as sale_qty
    from public.sale_items si
    group by
        si.sale_id,
        si.product_id
),

stock_out_qty as (
    select
        sm.reference_id as sale_id,
        sm.product_id,
        sum(abs(sm.quantity))::bigint as stock_out_qty
    from public.stock_movements sm
    where sm.movement_type = 'OUT'
      and sm.reference_type = 'SALE'
    group by
        sm.reference_id,
        sm.product_id
),

sale_product_comparison as (
    select
        coalesce(sq.sale_id, so.sale_id) as sale_id,
        coalesce(sq.product_id, so.product_id) as product_id,
        coalesce(sq.sale_qty, 0) as sale_qty,
        coalesce(so.stock_out_qty, 0) as stock_out_qty
    from sale_qty sq
    full outer join stock_out_qty so
        on so.sale_id = sq.sale_id
       and so.product_id = sq.product_id
),

ledger_aware_sales as (
    select
        s.id as sale_id
    from public.sales s
    cross join ledger_activation la
    where s.created_at >= la.activation_at
),

historical_sales as (
    select
        s.id as sale_id
    from public.sales s
    cross join ledger_activation la
    where s.created_at < la.activation_at
),

ledger_aware_mismatch as (
    select count(*)::bigint as mismatch_count
    from sale_product_comparison c
    join ledger_aware_sales ls
        on ls.sale_id = c.sale_id
    where c.sale_qty <> c.stock_out_qty
),

ledger_aware_without_stock_out as (
    select count(*)::bigint as sales_without_stock_out
    from ledger_aware_sales ls
    where not exists (
        select 1
        from public.stock_movements sm
        where sm.reference_type = 'SALE'
          and sm.movement_type = 'OUT'
          and sm.reference_id = ls.sale_id
    )
),

inventory_check as (
    select count(*)::bigint as stock_mismatch
    from public.products p
    left join (
        select
            product_id,
            sum(quantity) as ledger_stock
        from public.stock_movements
        group by product_id
    ) sm
        on sm.product_id = p.id
    where coalesce(p.stok, 0) <> coalesce(sm.ledger_stock, 0)
)

select
    la.activation_at as ledger_activation_at,

    (select count(*) from historical_sales)
        as historical_sales,

    (select count(*) from ledger_aware_sales)
        as ledger_aware_sales,

    lam.mismatch_count
        as ledger_aware_mismatch,

    lawso.sales_without_stock_out
        as ledger_aware_without_stock_out,

    ic.stock_mismatch
        as inventory_stock_mismatch,

    case
        when lam.mismatch_count = 0
         and lawso.sales_without_stock_out = 0
         and ic.stock_mismatch = 0
        then 'PASS'
        else 'FAILED'
    end as audit_status

from ledger_activation la
cross join ledger_aware_mismatch lam
cross join ledger_aware_without_stock_out lawso
cross join inventory_check ic;
