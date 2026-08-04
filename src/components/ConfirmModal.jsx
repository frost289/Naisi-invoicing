import { AnimatePresence, motion } from 'framer-motion'

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-charcoal/40 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card"
          >
            <h3 className="m-0 text-xl font-bold">{title}</h3>
            <p className="mt-2 text-sm text-charcoal/75">{message}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-charcoal/20 px-4 py-2 text-sm font-semibold transition hover:bg-charcoal/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default ConfirmModal
