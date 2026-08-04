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
import AnalyticsPage from './components/AnalyticsPage'
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

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getMonthKey(dateString) {
  if (!dateString) {
    return null
  }
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }
    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    return window.localStorage.getItem('naisi-theme') || (prefersDark ? 'dark' : 'light')
  })
  const [view, setView] = useState('invoices')

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('naisi-theme', theme)
  }, [theme])

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

  const analytics = useMemo(() => {
    const totalInvoices = invoices.length
    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0,
    )
    const averageInvoice = totalInvoices ? totalRevenue / totalInvoices : 0

    const customerTotals = new Map()
    invoices.forEach((invoice) => {
      const customer = invoice.customerName?.trim() || 'Unknown customer'
      const nextTotal = (customerTotals.get(customer) || 0) + Number(invoice.total || 0)
      customerTotals.set(customer, nextTotal)
    })

    const topCustomerEntry = [...customerTotals.entries()].sort((a, b) => b[1] - a[1])[0]
    const topCustomer = topCustomerEntry
      ? { name: topCustomerEntry[0], total: topCustomerEntry[1] }
      : null

    const recentMonths = []
    const now = new Date()
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      recentMonths.push({
        key: monthKey,
        label: date.toLocaleString('en-US', { month: 'short' }),
        total: 0,
        count: 0,
      })
    }

    const monthMap = new Map(recentMonths.map((month) => [month.key, month]))
    invoices.forEach((invoice) => {
      const monthKey = getMonthKey(invoice.date)
      const month = monthKey ? monthMap.get(monthKey) : null
      if (!month) {
        return
      }
      month.total += Number(invoice.total || 0)
      month.count += 1
    })

    const maxMonthTotal = Math.max(...recentMonths.map((month) => month.total), 1)
    const latestMonth = recentMonths[recentMonths.length - 1]

    return {
      totalInvoices,
      totalRevenue,
      averageInvoice,
      customerCount: customerTotals.size,
      topCustomer,
      recentMonths: recentMonths.map((month) => ({
        ...month,
        heightPercent: Math.max(8, (month.total / maxMonthTotal) * 100),
      })),
      latestMonth,
    }
  }, [invoices])

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

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
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
    <div className="min-h-screen bg-cream text-charcoal transition-colors duration-200">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">Internal Tool</p>
            <h1 className="m-0 text-xl font-bold md:text-2xl">Naisi Foods Invoicing</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-line/70 bg-surface p-1 shadow-card">
              <button
                type="button"
                onClick={() => setView('invoices')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  view === 'invoices' ? 'bg-amber text-charcoal' : 'text-muted'
                }`}
              >
                Invoices
              </button>
              <button
                type="button"
                onClick={() => setView('analytics')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  view === 'analytics' ? 'bg-amber text-charcoal' : 'text-muted'
                }`}
              >
                Analytics
              </button>
            </div>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-line/80 bg-surface px-4 py-2 text-sm font-semibold shadow-card transition hover:border-amber md:text-base"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </motion.button>

            {view === 'invoices' ? (
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={openCreateForm}
                className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:opacity-90 md:text-base"
              >
                New Invoice
              </motion.button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        {view === 'analytics' ? (
          <AnalyticsPage analytics={analytics} formatMoney={formatMoney} />
        ) : (
          <>
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
          </>
        )}
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
              toast.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
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
