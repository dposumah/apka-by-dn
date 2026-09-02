export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
}

export interface Account extends BaseEntity {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normalBalance: 'DEBIT' | 'CREDIT';
  description?: string | null;
}

export interface JournalEntry extends BaseEntity {
  number: string;
  date: Date;
  reference?: string | null;
  description: string;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine extends BaseEntity {
  journalEntryId: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string | null;
  account?: Account;
}

export interface ReportSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
}

export interface IncomeStatement {
  revenues: { account: Account; balance: number }[];
  totalRevenue: number;
  expenses: { account: Account; balance: number }[];
  totalExpense: number;
  netIncome: number;
}

export interface BalanceSheet {
  assets: { account: Account; balance: number }[];
  totalAssets: number;
  liabilities: { account: Account; balance: number }[];
  totalLiabilities: number;
  equity: { account: Account; balance: number }[];
  totalEquity: number;
}

export interface CashFlowStatement {
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netIncreaseInCash: number;
  beginningCashBalance: number;
  endingCashBalance: number;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    }
  }
}
