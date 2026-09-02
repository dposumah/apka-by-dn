'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';

export default function DetailAnggaranPage() {
  const { id } = useParams();
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudget();
  }, [id]);

  const fetchBudget = async () => {
    try {
      const res = await fetch(`/api/budgets/${id}`);
      const data = await res.json();
      setBudget(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!budget) return <div className="p-6">Data tidak ditemukan.</div>;

  let grandTotalBudget = 0;
  let grandTotalActual = 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">{budget.name}</h1>
          <p className="text-gray-500 mt-1">Periode Fiskal: {budget.fiscalPeriodId} | Status: <span className="font-semibold">{budget.status}</span></p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Monitoring Anggaran per Akun</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3">ID Akun</th>
                <th className="px-4 py-3 text-right">Anggaran (Setahun)</th>
                <th className="px-4 py-3 text-right">Realisasi (Setahun)</th>
                <th className="px-4 py-3 text-right">Varian</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {budget.lines.map((line: any) => {
                grandTotalBudget += line.totalAmount;
                grandTotalActual += line.totalActual;
                const variance = line.totalAmount - line.totalActual;
                const percent = line.totalAmount > 0 ? (line.totalActual / line.totalAmount) * 100 : 0;
                
                let colorClass = 'bg-green-100 text-green-800';
                if (percent > 100) colorClass = 'bg-red-100 text-red-800';
                else if (percent > 80) colorClass = 'bg-yellow-100 text-yellow-800';

                return (
                  <tr key={line.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{line.accountId}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(line.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(line.totalActual)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(variance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${colorClass}`}>
                        {percent.toFixed(1)}% Terpakai
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-bold">
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-right">{formatCurrency(grandTotalBudget)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(grandTotalActual)}</td>
                <td className={`px-4 py-3 text-right ${grandTotalBudget - grandTotalActual < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(grandTotalBudget - grandTotalActual)}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
