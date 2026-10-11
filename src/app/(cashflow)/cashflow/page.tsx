import { getCashflowProjects, getCashflowTransactions } from "@/actions/cashflow";
import CashflowDashboardClient from "./CashflowDashboardClient";
import Link from "next/link";
import { PlusCircle, FileText } from "lucide-react";

export const metadata = {
  title: "Dashboard Cashflow 3 Proyek",
};

export default async function CashflowPage() {
  const [projects, allTransactions] = await Promise.all([
    getCashflowProjects(),
    getCashflowTransactions(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Keuangan & Analisis Profit
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitoring arus kas masuk & keluar proyek Bina Insani, ASMI, dan IYRC
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/cashflow/laporan"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileText size={16} className="text-indigo-600" />
            Laporan Arus Kas
          </Link>
          <Link 
            href="/cashflow/transactions"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/20"
          >
            <PlusCircle size={16} />
            Kelola Transaksi
          </Link>
        </div>
      </div>

      <CashflowDashboardClient 
        initialTransactions={allTransactions} 
        projects={projects} 
      />
    </div>
  );
}
