import { describe, it, expect } from 'vitest';
import {
  validateDoubleEntry,
  generateEntryNumber,
  calculateRunningBalance,
  calculateMovingAverage,
  getNormalBalanceForType,
} from '@/lib/accounting';
import { validateJournalLines } from '@/lib/accounting-server';

describe('Accounting core helpers', () => {
  it('validates balanced double-entry lines within floating-point tolerance', () => {
    expect(
      validateDoubleEntry([
        { debit: 150000, credit: 0 },
        { debit: 0, credit: 150000 },
      ])
    ).toBe(true);

    expect(
      validateDoubleEntry([
        { debit: 150000, credit: 0 },
        { debit: 0, credit: 149000 },
      ])
    ).toBe(false);
  });

  it('generates sequential padded journal entry numbers', () => {
    const year = new Date().getFullYear();
    expect(generateEntryNumber('JU', 0)).toBe(`JU-${year}-0001`);
    expect(generateEntryNumber('JU', 42)).toBe(`JU-${year}-0043`);
  });

  it('computes running balances accurately for DEBIT and CREDIT normal balances', () => {
    const entries = [
      { debit: 1000, credit: 0 },
      { debit: 0, credit: 400 },
      { debit: 250, credit: 0 },
    ];
    expect(calculateRunningBalance(entries, 'DEBIT')).toEqual([1000, 600, 850]);
    expect(calculateRunningBalance(entries, 'CREDIT')).toEqual([-1000, -600, -850]);
  });

  it('computes moving average inventory cost and handles zero quantity', () => {
    expect(calculateMovingAverage(10, 1000, 10, 2000)).toEqual({
      newAvgCost: 1500,
      newTotalQty: 20,
    });
    expect(calculateMovingAverage(0, 0, 0, 0)).toEqual({
      newAvgCost: 0,
      newTotalQty: 0,
    });
  });

  it('returns standard normal balance for each account type', () => {
    expect(getNormalBalanceForType('ASSET')).toBe('DEBIT');
    expect(getNormalBalanceForType('EXPENSE')).toBe('DEBIT');
    expect(getNormalBalanceForType('LIABILITY')).toBe('CREDIT');
    expect(getNormalBalanceForType('EQUITY')).toBe('CREDIT');
    expect(getNormalBalanceForType('REVENUE')).toBe('CREDIT');
  });

  it('validates journal entry lines including minimums, negatives, zero rows, and balance', () => {
    expect(validateJournalLines([{ accountId: 'acc1', debit: 100, credit: 0 }]).valid).toBe(false);
    expect(
      validateJournalLines([
        { accountId: '', debit: 100, credit: 0 },
        { accountId: 'acc2', debit: 0, credit: 100 },
      ]).valid
    ).toBe(false);
    expect(
      validateJournalLines([
        { accountId: 'acc1', debit: -10, credit: 0 },
        { accountId: 'acc2', debit: 0, credit: 10 },
      ]).valid
    ).toBe(false);
    expect(
      validateJournalLines([
        { accountId: 'acc1', debit: 0, credit: 0 },
        { accountId: 'acc2', debit: 0, credit: 0 },
      ]).valid
    ).toBe(false);
    expect(
      validateJournalLines([
        { accountId: 'acc1', debit: 100000, credit: 0 },
        { accountId: 'acc2', debit: 0, credit: 90000 },
      ]).valid
    ).toBe(false);

    const ok = validateJournalLines([
      { accountId: 'acc1', debit: 250000, credit: 0 },
      { accountId: 'acc2', debit: 0, credit: 250000 },
    ]);
    expect(ok).toEqual({ valid: true, totalDebit: 250000, totalCredit: 250000 });
  });
});
