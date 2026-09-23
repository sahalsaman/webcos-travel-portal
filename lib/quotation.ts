export type QuotationItemInput = { description: string; quantity: number; unitPrice: number };

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateQuotation(items: QuotationItemInput[], discount: number, taxRate: number) {
  const calculatedItems = items.map((item) => ({
    ...item,
    amount: roundMoney(item.quantity * item.unitPrice),
  }));
  const subtotal = roundMoney(calculatedItems.reduce((sum, item) => sum + item.amount, 0));
  const appliedDiscount = Math.min(roundMoney(discount), subtotal);
  const taxableAmount = Math.max(0, subtotal - appliedDiscount);
  const taxAmount = roundMoney(taxableAmount * (taxRate / 100));
  const totalAmount = roundMoney(taxableAmount + taxAmount);
  return { items: calculatedItems, subtotal, discount: appliedDiscount, taxAmount, totalAmount };
}
