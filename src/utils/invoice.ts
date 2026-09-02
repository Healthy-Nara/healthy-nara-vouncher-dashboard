export const getInvoiceGrandTotal = (inv: any): number => {
  if (!inv) return 0;
  const baseAmount = Number(inv.amount) || 0;
  const platformFeeRate = inv.platformFeeRate !== undefined && inv.platformFeeRate !== null ? Number(inv.platformFeeRate) : 10;
  const platformFeeType = inv.platformFeeType || 'percentage';
  const platformFee = inv.platformFee !== undefined && inv.platformFee !== null ? Number(inv.platformFee) : platformFeeType === 'fixed' ? platformFeeRate : Math.round(baseAmount * (platformFeeRate / 100));
  const additionalChargesTotal = (inv.additionalCharges || []).reduce((sum: number, c: any) => sum + (Number(c?.amount) || 0), 0);
  return baseAmount + platformFee + additionalChargesTotal;
};
