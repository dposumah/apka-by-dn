'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnggaranPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      const data = await res.json();
      setBudgets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Daftar Anggaran</h1>
        <Button asChild>
          <Link href="/anggaran/baru">Buat Anggaran</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-4 text-center">Loading...</div> : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Nama Anggaran</th>
                  <th className="px-4 py-3">Periode Fiskal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total Anggaran</th>
                  <th className="px-4 py-3 text-right">Total Realisasi</th>
                  <th className="px-4 py-3 text-right">Varian</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b: any) => {
                  const variance = b.totalBudget - b.totalRealized;
                  return (
                    <tr key={b.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{b.name}</td>
                      <td className="px-4 py-3">{b.fiscalPeriodId}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs 
                          ${b.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(b.totalBudget)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(b.totalRealized)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(variance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/anggaran/${b.id}`} className="text-blue-600 hover:underline">Detail</Link>
                      </td>
                    </tr>
                  )
                })}
                {budgets.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-4">Belum ada data anggaran.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
