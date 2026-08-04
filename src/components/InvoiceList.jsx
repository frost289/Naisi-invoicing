import { AnimatePresence, motion } from 'framer-motion'
import InvoiceCard from './InvoiceCard'

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(4)].map((_, index) => {
        return (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-line/70 bg-surface shadow-card"
          />
        )
      })}
    </div>
  )
}

function EmptyState({ hasSearch }) {
  return (
    <div className="rounded-2xl border border-dashed border-line/80 bg-surface/70 p-10 text-center">
      <p className="text-4xl" role="img" aria-hidden="true">
        🧾
      </p>
      <h3 className="mt-3 text-lg font-bold">
        {hasSearch ? 'No matching invoices' : 'No invoices yet'}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-charcoal/70">
        {hasSearch
          ? 'Try a different customer name or invoice number.'
          : 'Create your first sales invoice to start tracking customer orders.'}
      </p>
    </div>
  )
}

function InvoiceList({
  loading,
  invoices,
  searchTerm,
  onSearch,
  onEdit,
  onDelete,
  onDownload,
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-line/70 bg-surface p-4 shadow-card md:p-5">
        <label className="mb-2 block text-sm font-semibold" htmlFor="search">
          Search invoices
        </label>
        <input
          id="search"
          type="text"
          value={searchTerm}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search by customer name or invoice number..."
          className="w-full rounded-xl border border-line/80 bg-cream px-4 py-3 text-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
        />
      </div>

      {loading ? <LoadingSkeleton /> : null}

      {!loading && invoices.length === 0 ? (
        <EmptyState hasSearch={Boolean(searchTerm.trim())} />
      ) : null}

      {!loading && invoices.length > 0 ? (
        <motion.div layout className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {invoices.map((invoice) => {
              return (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDownload={onDownload}
                />
              )
            })}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </section>
  )
}

export default InvoiceList
