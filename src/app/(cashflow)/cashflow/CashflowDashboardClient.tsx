"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { generateCashflowInsights } from "@/actions/cashflow";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function CashflowDashboardClient({ initialTransactions, projects }: { initialTransactions: any[], projects: any[] }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [insights, setInsights] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter local state based on selected Project, Month, Year
  const filteredTransactions = initialTransactions.filter(t => {
    const d = new Date(t.date);
    const matchProject = selectedProject ? t.projectId === selectedProject : true;
    const matchMonth = d.getMonth() === selectedMonth;
    const matchYear = d.getFullYear() === selectedYear;
    return matchProject && matchMonth && matchYear;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Prepare data for Bar Chart (Daily accumulation or Income vs Expense)
  const barChartData = [
    { name: "Pemasukan", amount: totalIncome, fill: "#4ade80" },
    { name: "Pengeluaran", amount: totalExpense, fill: "#f87171" }
  ];

  // Prepare data for Pie Chart (Expense Categories)
  const expenseByCategory = filteredTransactions
    .filter(t => t.type === "EXPENSE")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value
  }));

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    setInsights("");
    const res = await generateCashflowInsights(filteredTransactions);
    if (res.success) {
      setInsights(res.insights);
    } else {
      setInsights("Gagal membuat rekomendasi: " + res.error);
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proyek</label>
          <select 
            className="border-gray-300 rounded-md shadow-sm border p-2"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="">Semua Proyek</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
          <select 
            className="border-gray-300 rounded-md shadow-sm border p-2"
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
          >
            {Array.from({length: 12}).map((_, i) => (
              <option key={i} value={i}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
          <input 
            type="number" 
            className="border-gray-300 rounded-md shadow-sm border p-2 w-24"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Pemasukan</h3>
          <p className="text-2xl font-bold text-green-600">Rp {totalIncome.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Pengeluaran</h3>
          <p className="text-2xl font-bold text-red-600">Rp {totalExpense.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium">Profit Bersih</h3>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            Rp {netProfit.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Pemasukan vs Pengeluaran</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Kategori Pengeluaran</h3>
          <div className="h-64">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">Belum ada data pengeluaran</div>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow border border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-indigo-900 flex items-center">
            <span className="mr-2">✨</span> Rekomendasi AI (Gemini)
          </h3>
          <button 
            onClick={handleGenerateInsights}
            disabled={isGenerating || filteredTransactions.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isGenerating ? 'Memproses...' : 'Buat Rekomendasi'}
          </button>
        </div>
        
        {insights ? (
          <div className="prose prose-indigo max-w-none bg-white p-4 rounded border border-indigo-100">
             <div dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br/>') }} />
          </div>
        ) : (
          <p className="text-gray-600 italic">Klik tombol di atas untuk mendapatkan analisis dari Google Gemini AI berdasarkan data bulan ini.</p>
        )}
      </div>
    </div>
  );
}
