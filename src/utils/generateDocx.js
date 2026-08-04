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

function buildInfoRow(labelLeft, valueLeft, labelRight, valueRight) {
  return new TableRow({
    children: [labelLeft, valueLeft, labelRight, valueRight].map((value) => {
      return new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: value || '' })] })],
      })
    }),
  })
}

export async function generateInvoiceDocx(invoice) {
  const rowBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'd4d4d4' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'd4d4d4' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'd4d4d4' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'd4d4d4' },
  }

  const lines = invoice.items.map((item) => {
    const lineTotal = Number(item.qty) * Number(item.unitPrice)
    return new TableRow({
      children: [
        new TableCell({
          borders: rowBorder,
          children: [new Paragraph(String(item.qty))],
        }),
        new TableCell({
          borders: rowBorder,
          children: [new Paragraph(item.description)],
        }),
        new TableCell({
          borders: rowBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun(formatMoney(item.unitPrice))],
            }),
          ],
        }),
        new TableCell({
          borders: rowBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun(formatMoney(lineTotal))],
            }),
          ],
        }),
      ],
    })
  })

  const total = Number(invoice.total || calculateTotal(invoice.items))
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'NAISI FOODS', bold: true, size: 36 })],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'SALES INVOICE', bold: true, size: 28 })],
            spacing: { after: 280 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              buildInfoRow('Invoice No.', invoice.invoiceNo, 'Date', invoice.date),
              buildInfoRow('Customer', invoice.customerName, 'Phone', invoice.phone),
              buildInfoRow('Location', invoice.location, 'Terms', invoice.terms),
            ],
          }),
          new Paragraph({ text: '', spacing: { after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ['Qty', 'Description', 'Unit Price', 'Total'].map((text) => {
                  return new TableCell({
                    borders: rowBorder,
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text, bold: true })],
                      }),
                    ],
                  })
                }),
              }),
              ...lines,
              new TableRow({
                children: [
                  new TableCell({
                    borders: rowBorder,
                    children: [new Paragraph('')],
                  }),
                  new TableCell({
                    borders: rowBorder,
                    children: [new Paragraph('')],
                  }),
                  new TableCell({
                    borders: rowBorder,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: 'Grand Total', bold: true })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: rowBorder,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: formatMoney(total), bold: true })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '', spacing: { after: 400 } }),
          new Paragraph({
            children: [new TextRun({ text: 'Customer Signature: ___________' })],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const safeCustomerName = String(invoice.customerName || 'Customer').replace(
    /\s+/g,
    '_',
  )
  saveAs(blob, `${invoice.invoiceNo}_${safeCustomerName}.docx`)
}
