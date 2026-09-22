with daily_report as (
    select
        date_trunc('day', s.tanggal) as periode,
        count(*) as transaksi,
        coalesce(sum(s.total), 0) as omzet
    from public.sales s
    where s.tanggal >= date_trunc('month', now())
      and s.tanggal < date_trunc('month', now()) + interval '1 month'
    group by date_trunc('day', s.tanggal)
),

daily_rollup as (
    select
        coalesce(sum(transaksi), 0) as transaksi,
        coalesce(sum(omzet), 0) as omzet
    from daily_report
),

monthly_report as (
    select
        count(*) as transaksi,
        coalesce(sum(total), 0) as omzet
    from public.sales
    where tanggal >= date_trunc('month', now())
      and tanggal < date_trunc('month', now()) + interval '1 month'
)

select
    m.transaksi as monthly_transactions,
    d.transaksi as daily_transactions_rollup,
    m.omzet as monthly_revenue,
    d.omzet as daily_revenue_rollup,

    m.transaksi - d.transaksi as transaction_difference,
    m.omzet - d.omzet as revenue_difference,

    case
        when m.transaksi = d.transaksi
         and m.omzet = d.omzet
        then 'PASS'
        else 'FAILED'
    end as audit_status

from monthly_report m
cross join daily_rollup d;
