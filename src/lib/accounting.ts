export function validateDoubleEntry(lines: { debit: number; credit: number }[]): boolean {
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}

export function generateEntryNumber(prefix: string, lastNumber: number): string {
  const currentYear = new Date().getFullYear();
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `${prefix}-${currentYear}-${nextNumber}`;
}

export function calculateRunningBalance(
  entries: { debit: number; credit: number }[],
  normalBalance: 'DEBIT' | 'CREDIT'
): number[] {
  let balance = 0;
  return entries.map(entry => {
    if (normalBalance === 'DEBIT') {
      balance += entry.debit - entry.credit;
    } else {
      balance += entry.credit - entry.debit;
    }
    return balance;
  });
}

export function calculateMovingAverage(
  currentQty: number,
  currentAvgCost: number,
  newQty: number,
  newUnitCost: number
): { newAvgCost: number; newTotalQty: number } {
  const newTotalQty = currentQty + newQty;
  if (newTotalQty === 0) return { newAvgCost: 0, newTotalQty: 0 };
  
  const totalValue = (currentQty * currentAvgCost) + (newQty * newUnitCost);
  const newAvgCost = totalValue / newTotalQty;
  
  return { newAvgCost, newTotalQty };
}

export function getAccountTypeLabel(type: string): string {
  const map: Record<string, string> = {
    ASSET: 'Aset',
    LIABILITY: 'Kewajiban',
    EQUITY: 'Ekuitas',
    REVENUE: 'Pendapatan',
    EXPENSE: 'Beban',
  };
  return map[type] || type;
}

export function getNormalBalanceForType(type: string): 'DEBIT' | 'CREDIT' {
  switch (type) {
    case 'ASSET':
    case 'EXPENSE':
      return 'DEBIT';
    case 'LIABILITY':
    case 'EQUITY':
    case 'REVENUE':
    default:
      return 'CREDIT';
  }
}
