import { describe, it, expect } from "vitest";
import {
  buildCashflowJournalLines,
  inferIyrcBudgetPos,
  resolveCashAccountCode,
  suggestCashflowAccountCode,
} from "../lib/cashflow-accounting";
import {
  IYRC_ADDITIONAL_EXPENSE_ITEMS,
  IYRC_EXPENSE_BUDGET_POSITIONS,
  IYRC_PROGRAM_BREAKDOWN,
  IYRC_PROFIT_LOSS_TOTALS,
  IYRC_REVENUE_ITEMS,
  calculateIyrcUpNov26Scenario,
} from "../lib/iyrc-utils";

describe("cashflow-accounting & IYRC upNov26 helpers", () => {
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
    expect(
      inferIyrcBudgetPos({
        type: "EXPENSE",
        vendorName: "MY-ROBOT WORLDWIDE SDN BHD",
        description: "Trainer MRT Malaysia WW2611-00009",
      })
    ).toBe("TAMBAHAN");
    expect(
      inferIyrcBudgetPos({
        type: "EXPENSE",
        description: "Tiket pesawat Lauw Mei Hoa CGK-SZX PP",
      })
    ).toBe("TAMBAHAN");
    expect(
      inferIyrcBudgetPos({
        type: "EXPENSE",
        description: "Laundry Kotak Laundry Green Garden",
      })
    ).toBe("TAMBAHAN");
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

  it("matches exact totals of IYRC_China_2026_upNov26 Excel sheet", () => {
    const sumRevenue = IYRC_REVENUE_ITEMS.reduce((s, r) => s + r.amount, 0);
    const sumExpensePos = IYRC_EXPENSE_BUDGET_POSITIONS.reduce(
      (s, p) => s + p.budgetAmount,
      0
    );
    const sumAdditional = IYRC_ADDITIONAL_EXPENSE_ITEMS.reduce(
      (s, a) => s + a.amount,
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
    expect(sumAdditional).toBe(29577800);
    expect(IYRC_ADDITIONAL_EXPENSE_ITEMS).toHaveLength(13);
    expect(
      IYRC_ADDITIONAL_EXPENSE_ITEMS.filter((i) => i.initialStatus === "COMPLETED")
    ).toHaveLength(12);
    expect(
      IYRC_ADDITIONAL_EXPENSE_ITEMS.filter((i) => i.initialStatus === "PENDING")
    ).toHaveLength(1);
    expect(sumExpensePos).toBe(318729602);
    expect(sumProgramExp).toBe(IYRC_PROFIT_LOSS_TOTALS.totalExpenseBudget);
    expect(sumProgramProfit).toBe(IYRC_PROFIT_LOSS_TOTALS.projectedProfit);
    expect(IYRC_PROFIT_LOSS_TOTALS.projectedProfit).toBe(57915758);
  });

  it("calculates upNov26 scenario dynamically matching Excel at default and reacting to USD rate & equipment", () => {
    const base = calculateIyrcUpNov26Scenario();
    expect(base.totalRevenue).toBe(376645360);
    expect(base.totalMyRobotIdr).toBe(130795000);
    expect(base.totalKitPpn).toBe(42806802);
    expect(base.totalHotel).toBe(32550000);
    expect(base.totalTravel).toBe(83000000);
    expect(base.totalAdditionalWithEquip).toBe(29577800);
    expect(base.totalExpense).toBe(318729602);
    expect(base.netProfit).toBe(57915758);

    // Check USD exposure = $7070 (MY-ROBOT) + 7*$190 ($1330 Kit) + $1166 (Trainer) = $9566
    const plus1000 = calculateIyrcUpNov26Scenario({
      usdToIdr: 19500,
      equipmentPurchaseEstimate: 1500000,
    });
    expect(plus1000.totalExpense - base.totalExpense).toBe(9566 * 1000 + 1500000);
    expect(base.netProfit - plus1000.netProfit).toBe(9566 * 1000 + 1500000);
  });
});
