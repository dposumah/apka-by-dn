'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PajakPage() {
  const [summary, setSummary] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('PPN');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [year]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tax?year=${year}`);
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ringkasan Pajak</h1>
        <div className="flex space-x-4 items-center">
          <span className="text-sm font-medium">Tahun:</span>
          <select 
            className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={year} onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {[year-2, year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="outline">Export CSV</Button>
        </div>
      </div>

      <div className="flex space-x-2 border-b">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'PPN' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('PPN')}
        >
          PPN
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'PPH' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('PPH')}
        >
          PPh
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Laporan {activeTab} Tahun {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-4">Loading...</div> : (
            <div className="overflow-x-auto">
              {activeTab === 'PPN' ? (
                <table className="w-full text-sm text-left border">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 border-r">Bulan</th>
                      <th className="px-4 py-3 border-r text-right">PPN Keluaran (Output)</th>
                      <th className="px-4 py-3 border-r text-right">PPN Masukan (Input)</th>
                      <th className="px-4 py-3 text-right">Kurang / (Lebih) Bayar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s: any) => (
                      <tr key={s.month} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 border-r font-medium">{months[s.month - 1]}</td>
                        <td className="px-4 py-3 border-r text-right">{formatCurrency(s.ppnOut)}</td>
                        <td className="px-4 py-3 border-r text-right">{formatCurrency(s.ppnIn)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${s.ppnPayable > 0 ? 'text-red-600' : s.ppnPayable < 0 ? 'text-green-600' : ''}`}>
                          {formatCurrency(s.ppnPayable)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-4 py-3 border-r">TOTAL</td>
                      <td className="px-4 py-3 border-r text-right">{formatCurrency(summary.reduce((acc:any, s:any) => acc + s.ppnOut, 0))}</td>
                      <td className="px-4 py-3 border-r text-right">{formatCurrency(summary.reduce((acc:any, s:any) => acc + s.ppnIn, 0))}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(summary.reduce((acc:any, s:any) => acc + s.ppnPayable, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm text-left border">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 border-r">Bulan</th>
                      <th className="px-4 py-3 border-r text-right">PPh 21</th>
                      <th className="px-4 py-3 border-r text-right">PPh 23</th>
                      <th className="px-4 py-3 text-right">PPh Final 0.5%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s: any) => (
                      <tr key={s.month} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 border-r font-medium">{months[s.month - 1]}</td>
                        <td className="px-4 py-3 border-r text-right">{formatCurrency(s.pph21)}</td>
                        <td className="px-4 py-3 border-r text-right">{formatCurrency(s.pph23)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(s.pphFinal)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-4 py-3 border-r">TOTAL</td>
                      <td className="px-4 py-3 border-r text-right">{formatCurrency(summary.reduce((acc:any, s:any) => acc + s.pph21, 0))}</td>
                      <td className="px-4 py-3 border-r text-right">{formatCurrency(summary.reduce((acc:any, s:any) => acc + s.pph23, 0))}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(summary.reduce((acc:any, s:any) => acc + s.pphFinal, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
