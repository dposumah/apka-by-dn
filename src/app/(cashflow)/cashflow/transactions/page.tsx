import {
  getCashflowAccounts,
  getCashflowProjects,
  getCashflowTransactions,
} from "@/actions/cashflow";
import TransactionListClient from "./TransactionListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelola Transaksi Cashflow",
};

export default async function TransactionsPage() {
  const [projects, transactions, accounts] = await Promise.all([
    getCashflowProjects(),
    getCashflowTransactions(),
    getCashflowAccounts(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TransactionListClient
        projects={projects}
        initialTransactions={transactions}
        accounts={accounts}
      />
    </div>
  );
}
