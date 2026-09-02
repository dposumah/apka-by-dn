'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function BankAkunPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', bankName: '', accountNumber: '', balance: 0 });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddDialog(false);
        setFormData({ name: '', bankName: '', accountNumber: '', balance: 0 });
        fetchAccounts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Daftar Akun Bank</h1>
        <Button onClick={() => setShowAddDialog(true)}>Tambah Akun Bank</Button>
      </div>

      {showAddDialog && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tambah Akun Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Akun (Internal)</label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="BCA Operasional" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Bank</label>
                  <Input required value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} placeholder="BCA" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">No. Rekening</label>
                  <Input required value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Saldo Awal</label>
                  <Input type="number" required value={formData.balance} onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value)})} />
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
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Nama Akun</th>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">No. Rekening</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a: any) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3">{a.bankName}</td>
                    <td className="px-4 py-3">{a.accountNumber}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(a.balance)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${a.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {a.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4">Belum ada akun bank.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
