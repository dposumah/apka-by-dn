'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function RekonsiliasiPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [bankBalance, setBankBalance] = useState(0);
  const [selectedTx, setSelectedTx] = useState<string[]>([]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) fetchUnreconciled();
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    const res = await fetch('/api/bank-accounts');
    const data = await res.json();
    setAccounts(data);
    if (data.length > 0) setSelectedAccountId(data[0].id);
  };

  const fetchUnreconciled = async () => {
    const res = await fetch(`/api/bank-transactions?bankAccountId=${selectedAccountId}`);
    const data = await res.json();
    setTransactions(data.filter((t: any) => !t.isReconciled));
    setSelectedTx([]);
  };

  const handleToggle = (id: string) => {
    setSelectedTx(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleReconcile = async () => {
    if (selectedTx.length === 0) return alert('Pilih transaksi terlebih dahulu');
    try {
      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: selectedTx })
      });
      if (res.ok) {
        alert('Rekonsiliasi berhasil');
        fetchUnreconciled();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentAccount = accounts.find((a:any) => a.id === selectedAccountId);
  const bookBalance = currentAccount ? (currentAccount as any).balance : 0;
  
  // Adjusted Book Balance based on selected transactions? 
  // No, the book balance already includes these transactions (they were entered in APKA).
  // Reconciliation means checking off what has cleared the bank.
  
  const difference = bankBalance - bookBalance;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Rekonsiliasi Bank</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Pengaturan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Akun Bank</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Saldo Rekening Koran (Rp)</label>
              <Input type="number" value={bankBalance} onChange={(e) => setBankBalance(parseFloat(e.target.value) || 0)} />
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Saldo per Buku:</span>
                <span className="font-bold">{formatCurrency(bookBalance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Saldo per Bank:</span>
                <span className="font-bold">{formatCurrency(bankBalance)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span>Selisih:</span>
                <span className={`font-bold ${difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(difference)}
                </span>
              </div>
            </div>

            <Button className="w-full mt-4" onClick={handleReconcile} disabled={selectedTx.length === 0}>
              Rekonsiliasi Terpilih ({selectedTx.length})
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Transaksi Belum Direkonsiliasi</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 w-10">Pilih</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={selectedTx.includes(t.id)} onChange={() => handleToggle(t.id)} />
                    </td>
                    <td className="px-4 py-3">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3">{t.description}</td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {t.type === 'DEBIT' ? formatCurrency(t.amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {t.type === 'CREDIT' ? formatCurrency(t.amount) : '-'}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4">Tidak ada transaksi yang belum direkonsiliasi.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
