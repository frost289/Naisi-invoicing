import { motion } from 'framer-motion'
import DownloadButton from './DownloadButton'

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function InvoiceCard({ invoice, onEdit, onDelete, onDownload }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-line/70 bg-surface p-4 shadow-card transition-colors duration-200 md:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-charcoal/65">Invoice</p>
          <h3 className="m-0 text-base font-bold md:text-lg">{invoice.invoiceNo}</h3>
        </div>
        <p className="rounded-full bg-amberSoft px-3 py-1 text-xs font-semibold text-charcoal">
          {invoice.date}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium md:text-base">{invoice.customerName}</p>
        <p className="text-sm text-charcoal/70">{invoice.location}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3">
        <p className="text-sm font-semibold md:text-base">
          Total: <span className="text-amber">{formatMoney(invoice.total)}</span>
        </p>
        <div className="flex items-center gap-2">
          <DownloadButton onClick={() => onDownload(invoice)} />
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => onEdit(invoice)}
            className="rounded-lg border border-line/80 px-3 py-2 text-xs font-semibold text-charcoal transition hover:border-charcoal md:text-sm"
          >
            Edit
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => onDelete(invoice)}
            className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-dangerSoft md:text-sm"
          >
            Delete
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}

export default InvoiceCard
