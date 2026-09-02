'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function StokPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchMovements();
    }
  }, [selectedProductId, startDate, endDate]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?type=GOODS');
      const data = await res.json();
      setProducts(data);
      if (data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stock-movements?productId=${selectedProductId}&startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      // Reverse to show chronological order for running balance
      setMovements(data.reverse());
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  // Calculate summary and running balance
  let runningQty = 0;
  let runningValue = 0;
  let totalIn = 0;
  let totalOut = 0;

  const movementsWithBalance = movements.map((m: any) => {
    const isOut = m.type === 'OUT' || (m.type === 'ADJUSTMENT' && m.quantity < 0);
    const isIn = m.type === 'IN' || (m.type === 'ADJUSTMENT' && m.quantity > 0);
    
    if (isIn) {
      runningQty += m.quantity;
      runningValue += (m.quantity * m.unitCost);
      totalIn += m.quantity;
    } else if (isOut) {
      runningQty -= Math.abs(m.quantity);
      // For out, we use the average cost at that time. Let's assume unitCost stores it.
      runningValue -= (Math.abs(m.quantity) * m.unitCost);
      totalOut += Math.abs(m.quantity);
    }

    return { ...m, runningQty, runningValue };
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Kartu Stok</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Pilih Produk</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-600 font-medium">Total Masuk</p>
              <p className="text-2xl font-bold text-green-700">{totalIn}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-sm text-red-600 font-medium">Total Keluar</p>
              <p className="text-2xl font-bold text-red-700">{totalOut}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-600 font-medium">Saldo Akhir</p>
              <p className="text-2xl font-bold text-blue-700">{runningQty}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Referensi</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Harga Satuan</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Saldo Qty</th>
                    <th className="px-4 py-3 text-right">Saldo Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {movementsWithBalance.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-4 text-gray-500">Tidak ada pergerakan stok di periode ini.</td></tr>
                  ) : (
                    movementsWithBalance.map((m: any) => (
                      <tr key={m.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{format(new Date(m.date), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="px-4 py-3">{m.reference || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium 
                            ${m.type === 'IN' ? 'bg-green-100 text-green-700' : 
                              m.type === 'OUT' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {m.type === 'IN' ? 'Masuk' : m.type === 'OUT' ? 'Keluar' : 'Penyesuaian'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right ${m.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(m.unitCost)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(m.totalCost)}</td>
                        <td className="px-4 py-3 text-right font-bold">{m.runningQty}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(m.runningValue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
