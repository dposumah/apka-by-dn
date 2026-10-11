"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LaporanBulananClient({ rekaps }: { rekaps: any[] }) {
  // Aggregate data
  const aggregatedData = rekaps.reduce((acc, curr) => {
    const bulan = curr.bulan;
    if (!acc[bulan]) {
      acc[bulan] = {
        bulan,
        totalHonor: 0,
        totalTransport: 0,
        jumlahFasilitator: 0,
      };
    }
    acc[bulan].totalHonor += curr.totalHonor || 0;
    acc[bulan].totalTransport += curr.totalTransport || 0;
    acc[bulan].jumlahFasilitator += 1;
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(aggregatedData).sort((a: any, b: any) => a.bulan.localeCompare(b.bulan));

  const exportCSV = () => {
    if (chartData.length === 0) return alert('Tidak ada data untuk diexport');
    
    const headers = ['Bulan', 'Jumlah Fasilitator', 'Total Honor', 'Total Transport', 'Total Keseluruhan'];
    
    const rows = chartData.map((d: any) => {
      const total = d.totalHonor + d.totalTransport;
      return [d.bulan, d.jumlahFasilitator, d.totalHonor, d.totalTransport, total].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Rangkuman_Bulanan.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
        >
          Download CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Grafik Pengeluaran per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bulan" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="totalHonor" name="Honorarium" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="totalTransport" name="Transport" stackId="a" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">Belum ada data rekap.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabel Rangkuman Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fasilitator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Honor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Transport</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Keseluruhan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Belum ada data</td>
                  </tr>
                ) : (
                  chartData.map((d: any) => (
                    <tr key={d.bulan}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{d.bulan}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.jumlahFasilitator} Orang</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(d.totalHonor)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(d.totalTransport)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(d.totalHonor + d.totalTransport)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
