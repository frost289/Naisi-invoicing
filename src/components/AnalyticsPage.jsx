import { motion } from 'framer-motion'

function AnalyticsCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line/70 bg-cream p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  )
}

function AnalyticsPage({ analytics, formatMoney }) {
  return (
    <section className="space-y-6 rounded-2xl border border-line/70 bg-surface p-4 shadow-card transition-colors duration-200 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Overview</p>
          <h2 className="m-0 text-xl font-bold md:text-2xl">Analytics</h2>
        </div>
        <p className="text-sm text-muted">Live insights from your invoice collection.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard label="Invoices" value={analytics.totalInvoices} hint="Total invoices created" />
        <AnalyticsCard label="Revenue" value={formatMoney(analytics.totalRevenue)} hint="Combined sales value" />
        <AnalyticsCard label="Average" value={formatMoney(analytics.averageInvoice)} hint="Average invoice amount" />
        <AnalyticsCard label="Customers" value={analytics.customerCount} hint="Unique customer names" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-line/70 bg-cream p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-base font-bold">Last 6 months revenue</h3>
              <p className="text-sm text-muted">Monthly totals for recent activity.</p>
            </div>
            <p className="text-sm font-semibold text-amber">{analytics.latestMonth?.label || '—'}</p>
          </div>

          <div className="mt-4 flex h-56 items-end gap-3">
            {analytics.recentMonths.map((month) => (
              <div key={month.key} className="flex h-full flex-1 flex-col items-center">
                <div className="flex h-full w-full items-end">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.35 }}
                    className="w-full origin-bottom rounded-t-xl bg-amber"
                    style={{ height: `${month.heightPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-muted">{month.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line/70 bg-cream p-4">
          <h3 className="m-0 text-base font-bold">Top customer</h3>
          {analytics.topCustomer ? (
            <div className="mt-3 rounded-xl border border-line/70 bg-surface p-4">
              <p className="text-sm font-semibold">{analytics.topCustomer.name}</p>
              <p className="mt-1 text-2xl font-bold text-amber">{formatMoney(analytics.topCustomer.total)}</p>
              <p className="mt-1 text-sm text-muted">Highest invoice value total.</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No customer analytics yet.</p>
          )}

          <div className="mt-4 space-y-3">
            {analytics.recentMonths
              .slice()
              .reverse()
              .slice(0, 3)
              .map((month) => (
                <div key={month.key} className="flex items-center justify-between rounded-xl border border-line/70 bg-surface px-4 py-3">
                  <p className="text-sm font-medium">{month.label}</p>
                  <p className="text-sm font-semibold text-charcoal">{formatMoney(month.total)}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AnalyticsPage
