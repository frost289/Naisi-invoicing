import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { calculateTotal } from '../utils/calculateTotal'

const defaultTerms = 'CASH ON DELIVERY (COD)'

function defaultDate() {
  return new Date().toISOString().slice(0, 10)
}

function createDefaultItems() {
  return [{ description: '', qty: 1, unitPrice: 0 }]
}

function mapInvoiceToForm(invoice, fallbackInvoiceNo) {
  return {
    invoiceNo: invoice?.invoiceNo || fallbackInvoiceNo,
    date: invoice?.date || defaultDate(),
    customerName: invoice?.customerName || '',
    phone: invoice?.phone || '',
    location: invoice?.location || '',
    terms: invoice?.terms || defaultTerms,
    items:
      invoice?.items?.length > 0
        ? invoice.items.map((item) => ({
            description: item.description || '',
            qty: Number(item.qty) || 1,
            unitPrice: Number(item.unitPrice) || 0,
          }))
        : createDefaultItems(),
  }
}

function InvoiceForm({
  mode,
  initialValues,
  invoiceNo,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [formData, setFormData] = useState(() =>
    mapInvoiceToForm(initialValues, invoiceNo),
  )
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFormData(mapInvoiceToForm(initialValues, invoiceNo))
    setErrors({})
  }, [initialValues, invoiceNo, mode])

  const runningTotal = useMemo(() => calculateTotal(formData.items), [formData.items])

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const setItemField = (index, key, value) => {
    setFormData((prev) => {
      const nextItems = [...prev.items]
      nextItems[index] = { ...nextItems[index], [key]: value }
      return { ...prev, items: nextItems }
    })
  }

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', qty: 1, unitPrice: 0 }],
    }))
  }

  const removeItemRow = (index) => {
    if (formData.items.length === 1) {
      return
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.customerName.trim()) {
      nextErrors.customerName = 'Customer name is required.'
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone is required.'
    }
    if (!formData.location.trim()) {
      nextErrors.location = 'Location is required.'
    }
    if (!formData.date) {
      nextErrors.date = 'Date is required.'
    }

    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        nextErrors[`item-description-${index}`] = 'Description is required.'
      }
      if (!(Number(item.qty) > 0)) {
        nextErrors[`item-qty-${index}`] = 'Qty must be a positive number.'
      }
      if (!(Number(item.unitPrice) > 0)) {
        nextErrors[`item-price-${index}`] = 'Unit price must be a positive number.'
      }
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      return
    }

    const payload = {
      invoiceNo: mode === 'edit' ? formData.invoiceNo : invoiceNo,
      date: formData.date,
      customerName: formData.customerName.trim(),
      phone: formData.phone.trim(),
      location: formData.location.trim(),
      terms: formData.terms.trim() || defaultTerms,
      items: formData.items.map((item) => ({
        description: item.description.trim(),
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
      })),
      total: runningTotal,
    }

    await onSubmit(payload)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-line/70 bg-surface p-4 shadow-card transition-colors duration-200 md:p-6"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="m-0 text-xl font-bold md:text-2xl">
            {mode === 'edit' ? 'Edit Invoice' : 'Create Invoice'}
          </h2>
          <p className="text-sm text-charcoal/70">Invoice No: {formData.invoiceNo}</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line/80 px-4 py-2 text-sm font-semibold"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-amber/90 disabled:opacity-60"
          >
            {isSubmitting
              ? 'Saving...'
              : mode === 'edit'
                ? 'Save Changes'
                : 'Save Invoice'}
          </motion.button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Customer Name *</label>
          <input
            value={formData.customerName}
            onChange={(event) => setField('customerName', event.target.value)}
            className="w-full rounded-xl border border-line/80 bg-cream px-3 py-2.5 text-sm outline-none focus:border-amber"
          />
          {errors.customerName ? (
            <p className="mt-1 text-xs text-danger">{errors.customerName}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Phone *</label>
          <input
            value={formData.phone}
            onChange={(event) => setField('phone', event.target.value)}
            className="w-full rounded-xl border border-line/80 bg-cream px-3 py-2.5 text-sm outline-none focus:border-amber"
          />
          {errors.phone ? (
            <p className="mt-1 text-xs text-danger">{errors.phone}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Location *</label>
          <input
            value={formData.location}
            onChange={(event) => setField('location', event.target.value)}
            className="w-full rounded-xl border border-line/80 bg-cream px-3 py-2.5 text-sm outline-none focus:border-amber"
          />
          {errors.location ? (
            <p className="mt-1 text-xs text-danger">{errors.location}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(event) => setField('date', event.target.value)}
            className="w-full rounded-xl border border-line/80 bg-cream px-3 py-2.5 text-sm outline-none focus:border-amber"
          />
          {errors.date ? <p className="mt-1 text-xs text-danger">{errors.date}</p> : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Terms</label>
        <input
          value={formData.terms}
          onChange={(event) => setField('terms', event.target.value)}
          className="w-full rounded-xl border border-line/80 bg-cream px-3 py-2.5 text-sm outline-none focus:border-amber"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line/70">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-line/20 text-left text-xs uppercase tracking-wider">
              <th className="p-3">Description</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Unit Price</th>
              <th className="p-3">Line Total</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => {
              const lineTotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)
              return (
                <tr key={index} className="border-t border-line/70">
                  <td className="p-2 align-top">
                    <input
                      value={item.description}
                      onChange={(event) =>
                        setItemField(index, 'description', event.target.value)
                      }
                      className="w-full rounded-lg border border-line/80 bg-cream px-3 py-2 text-sm outline-none focus:border-amber"
                    />
                    {errors[`item-description-${index}`] ? (
                      <p className="mt-1 text-xs text-danger">
                        {errors[`item-description-${index}`]}
                      </p>
                    ) : null}
                  </td>
                  <td className="p-2 align-top">
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(event) => setItemField(index, 'qty', event.target.value)}
                      className="w-24 rounded-lg border border-line/80 bg-cream px-3 py-2 text-sm outline-none focus:border-amber"
                    />
                    {errors[`item-qty-${index}`] ? (
                      <p className="mt-1 text-xs text-danger">{errors[`item-qty-${index}`]}</p>
                    ) : null}
                  </td>
                  <td className="p-2 align-top">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(event) =>
                        setItemField(index, 'unitPrice', event.target.value)
                      }
                      className="w-32 rounded-lg border border-line/80 bg-cream px-3 py-2 text-sm outline-none focus:border-amber"
                    />
                    {errors[`item-price-${index}`] ? (
                      <p className="mt-1 text-xs text-danger">
                        {errors[`item-price-${index}`]}
                      </p>
                    ) : null}
                  </td>
                  <td className="p-3 text-sm font-medium">
                    {lineTotal.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="rounded-md border border-danger/30 px-2 py-1 text-xs font-semibold text-danger transition hover:bg-dangerSoft"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={addItemRow}
          className="rounded-lg border border-line/80 px-3 py-2 text-sm font-semibold"
        >
          + Add Item Row
        </motion.button>
        <p className="text-base font-bold">
          Running Total:{' '}
          <span className="text-amber">
            {runningTotal.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </p>
      </div>
    </form>
  )
}

export default InvoiceForm
