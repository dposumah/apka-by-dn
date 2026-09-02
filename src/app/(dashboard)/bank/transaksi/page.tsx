'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function BankTransaksiPage() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '', type: 'DEBIT' });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) fetchTransactions();
  }, [selectedAccountId, startDate, endDate]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      setAccounts(data);
      if (data.length > 0) setSelectedAccountId(data[0].id);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bank-transactions?bankAccountId=${selectedAccountId}&startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setTransactions(data.reverse()); // chronological
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = { ...formData, bankAccountId: selectedAccountId };
      const res = await fetch('/api/bank-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddDialog(false);
        setFormData({ date: new Date().toISOString().split('T')[0], description: '', amount: '', type: 'DEBIT' });
        fetchTransactions();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  let runningBalance = accounts.find((a:any) => a.id === selectedAccountId)?.balance || 0;
  // Calculate backwards based on current balance? Wait, for UI we just show the transaction amounts.
  // Real running balance requires initial balance at startDate. For simplicity, we just display amounts.

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transaksi Bank</h1>
        <Button onClick={() => setShowAddDialog(true)} disabled={!selectedAccountId}>Catat Transaksi</Button>
      </div>

      {showAddDialog && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Catat Transaksi Manual</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal</label>
                  <Input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipe</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="DEBIT">Masuk (Debit)</option>
                    <option value="CREDIT">Keluar (Kredit)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keterangan</label>
                  <Input required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jumlah (Rp)</label>
                  <Input type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <select 
              className="flex h-10 w-full md:w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} - {a.accountNumber}</option>
              ))}
            </select>
            <Input type="date" className="w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" className="w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-right">Debit (Masuk)</th>
                  <th className="px-4 py-3 text-right">Kredit (Keluar)</th>
                  <th className="px-4 py-3 text-center">Rekonsiliasi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3">{t.description}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {t.type === 'DEBIT' ? formatCurrency(t.amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">
                      {t.type === 'CREDIT' ? formatCurrency(t.amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.isReconciled ? <span className="text-green-600">✓</span> : <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4">Tidak ada transaksi.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
