"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Share2, Filter, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

export default function CashflowLaporanClient({ projects, transactions }: { projects: any[]; transactions: any[] }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const matchYear = d.getFullYear() === selectedYear;
      const matchProject = selectedProject ? t.projectId === selectedProject : true;
      return matchYear && matchProject;
    });
  }, [transactions, selectedYear, selectedProject]);

  // Aggregate by month (YYYY-MM)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { bulan: string; income: number; expense: number; txCount: number }>();

    for (let m = 0; m < 12; m++) {
      const key = `${selectedYear}-${String(m + 1).padStart(2, "0")}`;
      map.set(key, { bulan: key, income: 0, expense: 0, txCount: 0 });
    }

    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (map.has(key)) {
        const item = map.get(key)!;
        if (t.type === "INCOME") {
          item.income += t.amount;
        } else {
          item.expense += t.amount;
        }
        item.txCount += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.bulan.localeCompare(b.bulan));
  }, [filteredTransactions, selectedYear]);

  // Overall totals
  const totalIncome = filteredTransactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const marginPercent = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0.0";

  // Rows for table that only show months with activity or all months
  const activeMonths = monthlyData.filter(m => m.income > 0 || m.expense > 0);

  const exportCSV = () => {
    if (filteredTransactions.length === 0) return alert("Tidak ada data untuk diexport");

    const headers = ["Bulan", "Proyek", "Total Pemasukan (IDR)", "Total Pengeluaran (IDR)", "Profit Bersih (IDR)", "Margin (%)"];
    const projectName = projects.find(p => p.id === selectedProject)?.name || "Semua Proyek";

    const rows = monthlyData
      .filter(m => m.income > 0 || m.expense > 0)
      .map(m => {
        const profit = m.income - m.expense;
        const margin = m.income > 0 ? ((profit / m.income) * 100).toFixed(1) + "%" : "0%";
        return [m.bulan, projectName, m.income, m.expense, profit, margin].join(",");
      });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Cashflow_${projectName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToWA = async () => {
    if (activeMonths.length === 0) return alert("Belum ada data transaksi untuk disalin");

    const projectName = projects.find(p => p.id === selectedProject)?.name || "Bina Insani, ASMI & IYRC";

    let text = `*LAPORAN ARUS KAS & PROFIT (${projectName.toUpperCase()})*\n`;
    text += `*Tahun: ${selectedYear}*\n\n`;

    activeMonths.forEach(m => {
      const profit = m.income - m.expense;
      text += `📅 *Bulan: ${m.bulan}*\n`;
      text += `🟢 Pemasukan: ${formatCurrency(m.income)}\n`;
      text += `🔴 Pengeluaran: ${formatCurrency(m.expense)}\n`;
      text += `💎 *Profit: ${formatCurrency(profit)}*\n\n`;
    });

    text += `--------------------------------\n`;
    text += `📈 *TOTAL TAHUNAN (${selectedYear}):*\n`;
    text += `• Total Pemasukan: ${formatCurrency(totalIncome)}\n`;
    text += `• Total Pengeluaran: ${formatCurrency(totalExpense)}\n`;
    text += `• *Net Profit: ${formatCurrency(netProfit)} (Margin: ${marginPercent}%)*\n`;

    try {
      await navigator.clipboard.writeText(text);
      alert("Teks ringkasan berhasil disalin! Silakan paste di WhatsApp.");
    } catch {
      alert("Gagal menyalin teks. Silakan coba lagi.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Export Actions */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Filter size={13} className="text-indigo-600" /> Proyek
            </label>
            <select
              className="border-slate-300 rounded-xl shadow-sm border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 min-w-[200px]"
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
            >
              <option value="">Semua Proyek (Bina Insani, ASMI, IYRC)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Tahun
            </label>
            <input
              type="number"
              className="border-slate-300 rounded-xl shadow-sm border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 w-28"
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={copyToWA}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <Share2 size={15} /> Salin Format WA
          </button>
          <button
            onClick={exportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/20"
          >
            <Download size={15} /> Download CSV
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
              Total Pemasukan
              <TrendingUp size={16} className="text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-extrabold text-emerald-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi tahun {selectedYear}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
              Total Pengeluaran
              <TrendingDown size={16} className="text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-extrabold text-rose-600">
              {formatCurrency(totalExpense)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Biaya operasional & proyek</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 shadow-sm ${netProfit >= 0 ? "border-l-indigo-600" : "border-l-amber-500"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
              Profit Bersih
              <DollarSign size={16} className="text-indigo-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-extrabold ${netProfit >= 0 ? "text-indigo-700" : "text-rose-600"}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Laba / (Rugi) bersih</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
              Margin Keuntungan
              <Percent size={16} className="text-violet-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-extrabold text-violet-700">
              {marginPercent}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Rasio Profit terhadap Income</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">
            Tren Arus Kas per Bulan (Tahun {selectedYear})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={val => `Rp ${val / 1000000}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/60 py-4">
          <CardTitle className="text-base font-bold text-slate-900">
            Rincian Arus Kas Bulanan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-left">Bulan</th>
                  <th className="px-6 py-3.5 text-right">Pemasukan</th>
                  <th className="px-6 py-3.5 text-right">Pengeluaran</th>
                  <th className="px-6 py-3.5 text-right">Profit / (Loss)</th>
                  <th className="px-6 py-3.5 text-center">Margin</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {monthlyData.filter(m => m.income > 0 || m.expense > 0).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                      Belum ada transaksi tercatat untuk filter tahun dan proyek yang dipilih.
                    </td>
                  </tr>
                ) : (
                  monthlyData.filter(m => m.income > 0 || m.expense > 0).map(m => {
                    const profit = m.income - m.expense;
                    const margin = m.income > 0 ? ((profit / m.income) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={m.bulan} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                          {m.bulan}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-semibold whitespace-nowrap">
                          {formatCurrency(m.income)}
                        </td>
                        <td className="px-6 py-4 text-right text-rose-600 font-semibold whitespace-nowrap">
                          {formatCurrency(m.expense)}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${profit >= 0 ? "text-indigo-700" : "text-rose-600"}`}>
                          {formatCurrency(profit)}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-slate-700 whitespace-nowrap">
                          {margin}%
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${profit >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                            {profit >= 0 ? "SURPLUS" : "DEFISIT"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
