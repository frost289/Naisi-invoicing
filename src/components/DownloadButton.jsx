import { motion } from 'framer-motion'

function DownloadButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      type="button"
      onClick={onClick}
      className="rounded-lg border border-charcoal/15 px-3 py-2 text-xs font-semibold text-charcoal transition hover:border-amber hover:text-amber md:text-sm"
    >
      Download
    </motion.button>
  )
}

export default DownloadButton
