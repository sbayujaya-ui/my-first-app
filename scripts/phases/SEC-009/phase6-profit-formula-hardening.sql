with item_formula_audit as (
    select
        si.sale_id,
        si.id as sale_item_id,

        coalesce(si.harga, 0) as selling_price,
        coalesce(si.harga_beli, 0) as historical_cost,
        coalesce(si.jumlah, 0) as quantity,
        coalesce(si.subtotal, 0) as stored_subtotal,

        (
            coalesce(si.harga, 0)
            * coalesce(si.jumlah, 0)
        ) as calculated_subtotal,

        (
            coalesce(si.harga_beli, 0)
            * coalesce(si.jumlah, 0)
        ) as calculated_cost

    from public.sale_items si
    join public.sales s
        on s.id = si.sale_id

    where s.tanggal >= date_trunc('month', now())
      and s.tanggal < date_trunc('month', now()) + interval '1 month'
),

formula_check as (
    select
        count(*) as total_sale_items,

        count(*) filter (
            where stored_subtotal = calculated_subtotal
        ) as correct_subtotals,

        count(*) filter (
            where stored_subtotal <> calculated_subtotal
        ) as incorrect_subtotals,

        coalesce(
            sum(stored_subtotal),
            0
        ) as stored_revenue,

        coalesce(
            sum(calculated_subtotal),
            0
        ) as calculated_revenue,

        coalesce(
            sum(calculated_cost),
            0
        ) as calculated_historical_cost,

        coalesce(
            sum(stored_subtotal),
            0
        )
        -
        coalesce(
            sum(calculated_cost),
            0
        ) as calculated_gross_profit

    from item_formula_audit
)

select
    total_sale_items,

    correct_subtotals,
    incorrect_subtotals,

    stored_revenue,
    calculated_revenue,

    calculated_historical_cost,
    calculated_gross_profit,

    stored_revenue - calculated_revenue
        as subtotal_difference,

    case
        when incorrect_subtotals = 0
         and stored_revenue = calculated_revenue
        then 'PASS'
        else 'FAILED'
    end as selling_price_formula_status

from formula_check;


with profit_reconciliation as (
    select
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
),

independent_profit as (
    select
        revenue,
        historical_cost,
        revenue - historical_cost as expected_gross_profit
    from profit_reconciliation
)

select
    revenue,
    historical_cost,
    expected_gross_profit,

    case
        when expected_gross_profit =
             revenue - historical_cost
        then 'PASS'
        else 'FAILED'
    end as independent_profit_formula_status

from independent_profit;


select
    count(*) as sales_without_items

from public.sales s

where s.tanggal >= date_trunc('month', now())
  and s.tanggal < date_trunc('month', now()) + interval '1 month'

  and not exists (
      select 1
      from public.sale_items si
      where si.sale_id = s.id
  );


select
    count(*) as orphan_sale_items

from public.sale_items si

where not exists (
    select 1
    from public.sales s
    where s.id = si.sale_id
);
