import { getCashflowProjects, getCashflowTransactions } from "@/actions/cashflow";
import CashflowDashboardClient from "./CashflowDashboardClient";
import Link from "next/link";

export const metadata = {
  title: "Dashboard Uang Masuk & Keluar",
};

export default async function CashflowPage() {
  const projects = await getCashflowProjects();
  // Fetch all for current year/month initially, but we'll just fetch all and let client filter for the demo, or fetch everything for the year.
  // For production with thousands of rows, server-side filtering is better, but here we pass all to client for fast filtering.
  const allTransactions = await getCashflowTransactions();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Uang Masuk & Keluar</h1>
          <p className="text-gray-500">Analisis keuangan untuk proyek Bina Insani, ASMI, dan IYRC</p>
        </div>
        <Link 
          href="/admin/cashflow/transactions"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Kelola Transaksi
        </Link>
      </div>

      <CashflowDashboardClient 
        initialTransactions={allTransactions} 
        projects={projects} 
      />
    </div>
  );
}
