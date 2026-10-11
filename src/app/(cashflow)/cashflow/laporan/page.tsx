import { getCashflowProjects, getCashflowTransactions } from "@/actions/cashflow";
import CashflowLaporanClient from "./client-page";

export const metadata = {
  title: "Laporan Arus Kas 3 Proyek",
};

export default async function CashflowLaporanPage() {
  const [projects, transactions] = await Promise.all([
    getCashflowProjects(),
    getCashflowTransactions(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Laporan Arus Kas & Analisis Bulanan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Rekapitulasi pemasukan, pengeluaran, dan margin keuntungan proyek Bina Insani, ASMI, dan IYRC
        </p>
      </div>

      <CashflowLaporanClient projects={projects} transactions={transactions} />
    </div>
  );
}
