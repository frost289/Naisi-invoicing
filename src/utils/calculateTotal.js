export function calculateTotal(items = []) {
  return items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0
    const unitPrice = Number(item.unitPrice) || 0
    return sum + qty * unitPrice
  }, 0)
}
