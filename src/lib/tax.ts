export const TAX_RATES = {
  PPN: 0.11,
  PPH23: 0.02,
  PPH_FINAL_UMKM: 0.005,
};

export const PTKP_RATES: Record<string, number> = {
  'TK/0': 54000000,
  'TK/1': 58500000,
  'TK/2': 63000000,
  'TK/3': 67500000,
  'K/0': 58500000,
  'K/1': 63000000,
  'K/2': 67500000,
  'K/3': 72000000,
};

export function calculatePPN(baseAmount: number, rate: number = TAX_RATES.PPN): { baseAmount: number; taxAmount: number; totalAmount: number } {
  const taxAmount = baseAmount * rate;
  return {
    baseAmount,
    taxAmount,
    totalAmount: baseAmount + taxAmount,
  };
}

export function calculatePPh21(grossSalary: number, ptkpStatus: string): number {
  const annualizedSalary = grossSalary * 12;
  const ptkp = PTKP_RATES[ptkpStatus] || PTKP_RATES['TK/0'];
  const pkp = Math.max(0, annualizedSalary - ptkp);
  
  let tax = 0;
  if (pkp > 0 && pkp <= 60000000) tax = pkp * 0.05;
  else if (pkp > 60000000) tax = (60000000 * 0.05) + ((pkp - 60000000) * 0.15); 
  
  return tax / 12;
}

export function calculatePPh23(amount: number, rate: number = TAX_RATES.PPH23): number {
  return amount * rate;
}

export function calculatePPhFinal(revenue: number, rate: number = TAX_RATES.PPH_FINAL_UMKM): number {
  return revenue * rate;
}
