import { getCashflowProjects, getCashflowTransactions } from "@/actions/cashflow";
import TransactionListClient from "./TransactionListClient";

export const metadata = {
  title: "Kelola Transaksi Cashflow",
};

export default async function TransactionsPage() {
  const projects = await getCashflowProjects();
  const transactions = await getCashflowTransactions();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TransactionListClient projects={projects} initialTransactions={transactions} />
    </div>
  );
}
