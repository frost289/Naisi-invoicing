import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import ConfirmModal from './components/ConfirmModal'
import InvoiceForm from './components/InvoiceForm'
import InvoiceList from './components/InvoiceList'
import { db } from './firebase'
import { generateInvoiceDocx } from './utils/generateDocx'

function getNextInvoiceNo(invoices, dateString = '') {
  const chosenYear = Number(dateString?.slice(0, 4)) || new Date().getFullYear()
  const prefix = `NF-INV-${chosenYear}-`
  let maxSerial = 0

  for (const invoice of invoices) {
    if (!invoice.invoiceNo?.startsWith(prefix)) {
      continue
    }
    const serial = Number(invoice.invoiceNo.slice(prefix.length))
    if (Number.isFinite(serial) && serial > maxSerial) {
      maxSerial = serial
    }
  }

  return `${prefix}${String(maxSerial + 1).padStart(4, '0')}`
}

function App() {
  const [invoices, setInvoices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [pendingDeleteInvoice, setPendingDeleteInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const invoicesQuery = query(
      collection(db, 'invoices'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(
      invoicesQuery,
      (snapshot) => {
        const nextInvoices = snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }))
        setInvoices(nextInvoices)
        setLoading(false)
      },
      (error) => {
        console.error('Failed to load invoices:', error)
        setLoading(false)
        setToast({
          type: 'error',
          message: 'Failed to load invoices. Please refresh and try again.',
        })
      },
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!toast) {
      return undefined
    }
    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 2800)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const nextInvoiceNo = useMemo(() => getNextInvoiceNo(invoices), [invoices])

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()
    if (!normalizedQuery) {
      return invoices
    }

    return invoices.filter((invoice) => {
      return (
        invoice.customerName?.toLowerCase().includes(normalizedQuery) ||
        invoice.invoiceNo?.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [invoices, searchTerm])

  const openCreateForm = () => {
    setEditingInvoice(null)
    setShowForm(true)
  }

  const openEditForm = (invoice) => {
    setEditingInvoice(invoice)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingInvoice(null)
  }

  const handleSaveInvoice = async (invoicePayload) => {
    setIsSaving(true)
    try {
      if (editingInvoice) {
        await updateDoc(doc(db, 'invoices', editingInvoice.id), {
          ...invoicePayload,
        })
        setToast({ type: 'success', message: 'Invoice updated successfully.' })
      } else {
        await addDoc(collection(db, 'invoices'), {
          ...invoicePayload,
          createdAt: serverTimestamp(),
        })
        setToast({ type: 'success', message: 'Invoice created successfully.' })
      }
      closeForm()
    } catch (error) {
      console.error('Failed to save invoice:', error)
      setToast({
        type: 'error',
        message: 'Unable to save invoice. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteInvoice = async () => {
    if (!pendingDeleteInvoice) {
      return
    }
    try {
      await deleteDoc(doc(db, 'invoices', pendingDeleteInvoice.id))
      setToast({ type: 'success', message: 'Invoice deleted.' })
    } catch (error) {
      console.error('Failed to delete invoice:', error)
      setToast({
        type: 'error',
        message: 'Unable to delete invoice. Please try again.',
      })
    } finally {
      setPendingDeleteInvoice(null)
    }
  }

  const handleDownloadInvoice = async (invoice) => {
    try {
      await generateInvoiceDocx(invoice)
    } catch (error) {
      console.error('Failed to generate docx:', error)
      setToast({
        type: 'error',
        message: 'Could not generate Word file. Please try again.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-20 border-b border-charcoal/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">
              Internal Tool
            </p>
            <h1 className="m-0 text-xl font-bold md:text-2xl">Naisi Foods Invoicing</h1>
          </div>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-charcoal px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-charcoal/90 md:text-base"
          >
            New Invoice
          </motion.button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <InvoiceForm
                mode={editingInvoice ? 'edit' : 'create'}
                initialValues={editingInvoice}
                invoiceNo={editingInvoice?.invoiceNo ?? nextInvoiceNo}
                isSubmitting={isSaving}
                onCancel={closeForm}
                onSubmit={handleSaveInvoice}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <InvoiceList
          loading={loading}
          invoices={filteredInvoices}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          onEdit={openEditForm}
          onDelete={setPendingDeleteInvoice}
          onDownload={handleDownloadInvoice}
        />
      </main>

      <ConfirmModal
        isOpen={Boolean(pendingDeleteInvoice)}
        title="Delete invoice"
        message={`Delete ${pendingDeleteInvoice?.invoiceNo || ''} permanently?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteInvoice(null)}
        onConfirm={handleDeleteInvoice}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-30 rounded-xl px-4 py-3 text-sm font-semibold shadow-card ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            <span className="mr-2" role="img" aria-hidden="true">
              {toast.type === 'success' ? '✓' : '!'}
            </span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
