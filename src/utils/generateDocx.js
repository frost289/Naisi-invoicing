import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { saveAs } from 'file-saver'
import { calculateTotal } from './calculateTotal'

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDateTime(value) {
  if (!value) return ''
  let d = null
  // Support Firestore Timestamp, ISO strings, or Date
  if (value && typeof value.toDate === 'function') {
    d = value.toDate()
  } else if (typeof value === 'string' || typeof value === 'number') {
    d = new Date(value)
  } else if (value instanceof Date) {
    d = value
  }
  if (!d || Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-GB', { hour12: false })
}

function buildInfoCell(text, isLabel = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: text || '', bold: !!isLabel, size: isLabel ? 20 : 22 }),
        ],
      }),
    ],
  })
}

function buildInfoRow(labelLeft, valueLeft, labelRight, valueRight) {
  return new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: labelLeft || '', bold: true })] })] }),
      new TableCell({ children: [new Paragraph(String(valueLeft || ''))] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: labelRight || '', bold: true })] })] }),
      new TableCell({ children: [new Paragraph(String(valueRight || ''))] }),
    ],
  })
}

export async function generateInvoiceDocx(invoice) {
  const rowBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'd4d4d4' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'd4d4d4' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'd4d4d4' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'd4d4d4' },
  }

  const lines = (invoice.items || []).map((item) => {
    const lineTotal = Number(item.qty || 0) * Number(item.unitPrice || 0)
    return new TableRow({
      children: [
        new TableCell({
          columnSpan: 1,
          borders: rowBorder,
          width: { size: 10, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [new TextRun({ text: String(item.qty || ''), size: 22 })],
            }),
          ],
        }),
        new TableCell({
          borders: rowBorder,
          width: { size: 55, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({ children: [new TextRun({ text: item.description || '', size: 22 })] }),
          ],
        }),
        new TableCell({
          borders: rowBorder,
          width: { size: 17, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: formatMoney(item.unitPrice), size: 22 })],
            }),
          ],
        }),
        new TableCell({
          borders: rowBorder,
          width: { size: 18, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: formatMoney(lineTotal), size: 22 })],
            }),
          ],
        }),
      ],
    })
  })

  const total = Number(invoice.total || calculateTotal(invoice.items || []))

  // Determine a sensible timestamp: prefer invoice.createdAt if available, otherwise use current time
  const generatedAt = new Date()
  const invoiceCreated = invoice.createdAt && typeof invoice.createdAt.toDate === 'function'
    ? invoice.createdAt.toDate()
    : invoice.createdAt
  const createdAtStr = formatDateTime(invoiceCreated) || ''
  const generatedAtStr = formatDateTime(generatedAt)

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'NAISI FOODS', bold: true, size: 40 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'SALES INVOICE', bold: true, size: 28 }),
            ],
            spacing: { after: 300 },
          }),

          // Info table (4 columns)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              buildInfoRow('Invoice No.', invoice.invoiceNo || '', 'Date', invoice.date || ''),
              buildInfoRow('Customer', invoice.customerName || '', 'Phone', invoice.phone || ''),
              buildInfoRow('Location', invoice.location || '', 'Terms', invoice.terms || ''),
              buildInfoRow('Created At', createdAtStr, 'Generated', generatedAtStr),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // Items table with header
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: rowBorder,
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'Qty', bold: true })] }),
                    ],
                  }),
                  new TableCell({
                    borders: rowBorder,
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'Description', bold: true })] }),
                    ],
                  }),
                  new TableCell({
                    borders: rowBorder,
                    width: { size: 17, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Unit Price', bold: true })] }),
                    ],
                  }),
                  new TableCell({
                    borders: rowBorder,
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Total', bold: true })] }),
                    ],
                  }),
                ],
              }),
              // Item lines
              ...lines,

              // Grand total row
              new TableRow({
                children: [
                  new TableCell({ borders: rowBorder, children: [new Paragraph('')] }),
                  new TableCell({ borders: rowBorder, children: [new Paragraph('')] }),
                  new TableCell({
                    borders: rowBorder,
                    children: [
                      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Grand Total', bold: true })] }),
                    ],
                  }),
                  new TableCell({
                    borders: rowBorder,
                    children: [
                      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatMoney(total), bold: true })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // Generated timestamp and small footer note
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Document generated: ${generatedAtStr}`, italics: true, size: 18 }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          new Paragraph({
            children: [new TextRun({ text: 'Customer Signature: ______________________________________', size: 22 })],
          }),

          new Paragraph({ text: '', spacing: { after: 100 } }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Thank you for your business!', italics: true, size: 20 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const safeCustomerName = String(invoice.customerName || 'Customer').replace(/\s+/g, '_')
  saveAs(blob, `${invoice.invoiceNo || 'invoice'}_${safeCustomerName}.docx`)
}
