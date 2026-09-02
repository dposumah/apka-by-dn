'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnggaranBaruPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [fiscalPeriodId, setFiscalPeriodId] = useState('2024'); // Mock for now
  
  const [lines, setLines] = useState([
    { accountId: 'mock-account-1', monthlyAmounts: Array(12).fill(0) }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', monthlyAmounts: Array(12).fill(0) }]);
  };

  const handleLineChange = (index: number, monthIndex: number, value: string) => {
    const newLines = [...lines];
    newLines[index].monthlyAmounts[monthIndex] = parseFloat(value) || 0;
    setLines(newLines);
  };

  const handleSubmit = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fiscalPeriodId, status, lines })
      });
      if (res.ok) router.push('/anggaran');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const grandTotal = lines.reduce((sum, line) => sum + line.monthlyAmounts.reduce((a,b)=>a+b, 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-full">
      <h1 className="text-3xl font-bold">Buat Anggaran Baru</h1>

      <Card>
        <CardHeader><CardTitle>Informasi Utama</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Anggaran</label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Anggaran Biaya Marketing 2024" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Periode Fiskal</label>
              <Input required value={fiscalPeriodId} onChange={e => setFiscalPeriodId(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>Rincian Anggaran</CardTitle>
            <Button variant="outline" onClick={handleAddLine}>Tambah Baris (Akun)</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-2 py-2 min-w-[200px]">Akun Pengeluaran</th>
                {Array.from({length:12}).map((_, i) => <th key={i} className="px-2 py-2 w-24">Bln {i+1}</th>)}
                <th className="px-2 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">
                    <Input placeholder="ID Akun" value={line.accountId} onChange={e => {
                      const newLines = [...lines]; newLines[idx].accountId = e.target.value; setLines(newLines);
                    }} />
                  </td>
                  {line.monthlyAmounts.map((amt, mIdx) => (
                    <td key={mIdx} className="p-1">
                      <Input type="number" className="w-20 text-xs px-1" value={amt || ''} onChange={e => handleLineChange(idx, mIdx, e.target.value)} />
                    </td>
                  ))}
                  <td className="p-2 text-right font-bold">
                    {formatCurrency(line.monthlyAmounts.reduce((a,b)=>a+b, 0))}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td colSpan={13} className="p-3 text-right">TOTAL KESELURUHAN</td>
                <td className="p-3 text-right text-lg text-blue-700">{formatCurrency(grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end space-x-4 mt-6">
            <Button variant="outline" onClick={() => handleSubmit('DRAFT')} disabled={loading}>Simpan sebagai Draft</Button>
            <Button onClick={() => handleSubmit('ACTIVE')} disabled={loading}>Aktifkan Anggaran</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
