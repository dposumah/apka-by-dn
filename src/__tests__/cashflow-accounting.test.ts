import { describe, it, expect } from "vitest";
import {
  buildCashflowJournalLines,
  inferIyrcBudgetPos,
  resolveCashAccountCode,
  suggestCashflowAccountCode,
} from "../lib/cashflow-accounting";
import {
  IYRC_EXPENSE_BUDGET_POSITIONS,
  IYRC_PROGRAM_BREAKDOWN,
  IYRC_PROFIT_LOSS_TOTALS,
  IYRC_REVENUE_ITEMS,
} from "../lib/iyrc-utils";

describe("cashflow-accounting & IYRC upNov10 helpers", () => {
  it("resolves cash vs BCA account codes from payment method", () => {
    expect(resolveCashAccountCode("CASH")).toBe("111.10.101");
    expect(resolveCashAccountCode("Kas Tunai")).toBe("111.10.101");
    expect(resolveCashAccountCode("TRANSFER")).toBe("111.11.101");
    expect(resolveCashAccountCode("BANK")).toBe("111.11.101");
  });

  it("maps IYRC revenues and expenses to expected COA codes", () => {
    expect(
      suggestCashflowAccountCode({ type: "INCOME", iyrcBudgetPos: "REV_SNT_1" })
    ).toBe("400.10.105");
    expect(
      suggestCashflowAccountCode({ type: "INCOME", iyrcBudgetPos: "REV_KIT_SNT" })
    ).toBe("400.10.102");
    expect(
      suggestCashflowAccountCode({ type: "INCOME", iyrcBudgetPos: "REV_GRETHA" })
    ).toBe("400.10.104");
    expect(
      suggestCashflowAccountCode({ type: "EXPENSE", iyrcBudgetPos: "MY_ROBOT" })
    ).toBe("600.10.027");
    expect(
      suggestCashflowAccountCode({ type: "EXPENSE", iyrcBudgetPos: "KIT_PPN" })
    ).toBe("500.10.102");
    expect(
      suggestCashflowAccountCode({
        type: "EXPENSE",
        iyrcBudgetPos: "KIT_PPN",
        description: "Setor PPN keluaran kit SNT",
      })
    ).toBe("600.10.037");
    expect(
      suggestCashflowAccountCode({ type: "EXPENSE", iyrcBudgetPos: "HOTEL" })
    ).toBe("600.10.026");
  });

  it("infers IYRC expense budget positions from invoice vendor/description", () => {
    expect(
      inferIyrcBudgetPos({
        type: "EXPENSE",
        vendorName: "MY-ROBOT WORLDWIDE SDN BHD",
        description: "WW2611-00002 Registration",
      })
    ).toBe("MY_ROBOT");
    expect(
      inferIyrcBudgetPos({
        type: "EXPENSE",
        vendorName: "Hotel 88 Kedoya",
        description: "Akomodasi siswa 26 malam",
      })
    ).toBe("HOTEL");
    expect(
      inferIyrcBudgetPos({
        type: "EXPENSE",
        description: "Tiket pesawat CGK-SZX & Visa China",
      })
    ).toBe("TIKET_VISA");
  });

  it("builds balanced double-entry journal lines for income with tax withholding", () => {
    const lines = buildCashflowJournalLines({
      type: "INCOME",
      amount: 38198198,
      taxWithheldAmount: 4201802,
      cashAccountId: "cash-bca",
      counterAccountId: "rev-kit",
      taxAccountId: "exp-tax",
      description: "Pengadaan Kit SNT",
      projectName: "IYRC",
    });

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    expect(lines).toHaveLength(3);
    expect(totalDebit).toBe(42400000);
    expect(totalCredit).toBe(42400000);
  });

  it("matches exact totals of IYRC_China 2026 upNov10 Excel sheet", () => {
    const sumRevenue = IYRC_REVENUE_ITEMS.reduce((s, r) => s + r.amount, 0);
    const sumExpensePos = IYRC_EXPENSE_BUDGET_POSITIONS.reduce(
      (s, p) => s + p.budgetAmount,
      0
    );
    const sumProgramRev = IYRC_PROGRAM_BREAKDOWN.reduce(
      (s, p) => s + p.revenueBudget,
      0
    );
    const sumProgramExp = IYRC_PROGRAM_BREAKDOWN.reduce(
      (s, p) => s + p.expenseBudget,
      0
    );
    const sumProgramProfit = IYRC_PROGRAM_BREAKDOWN.reduce(
      (s, p) => s + p.profitBudget,
      0
    );

    expect(sumRevenue).toBe(376645360);
    expect(sumProgramRev).toBe(IYRC_PROFIT_LOSS_TOTALS.totalRevenueBudget);
    expect(sumExpensePos).toBe(297451802);
    expect(sumProgramExp).toBe(IYRC_PROFIT_LOSS_TOTALS.totalExpenseBudget);
    expect(sumProgramProfit).toBe(IYRC_PROFIT_LOSS_TOTALS.projectedProfit);
  });
});
