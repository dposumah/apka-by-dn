'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function PenyesuaianStokPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentAdjustments, setRecentAdjustments] = useState([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    type: 'ADJUSTMENT',
    quantity: '',
    unitCost: '',
    notes: '',
    reference: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchRecentAdjustments();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?type=GOODS');
      const data = await res.json();
      setProducts(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, productId: data[0].id }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRecentAdjustments = async () => {
    // We could fetch recent movements where type='ADJUSTMENT'
    try {
      const d = new Date(); d.setDate(d.getDate() - 7);
      const res = await fetch(`/api/stock-movements?startDate=${d.toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`);
      const data = await res.json();
      setRecentAdjustments(data.filter((m:any) => m.type === 'ADJUSTMENT').slice(0, 10));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert('Penyesuaian stok berhasil disimpan');
        setFormData(prev => ({ ...prev, quantity: '', unitCost: '', notes: '', reference: '' }));
        fetchRecentAdjustments();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Penyesuaian Stok</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Penyesuaian</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal</label>
                <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Produk</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  required
                >
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.name} (Stok: {p.stockQuantity})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe Penyesuaian</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="ADJUSTMENT">Penyesuaian (Adjustment)</option>
                  <option value="IN">Masuk (In)</option>
                  <option value="OUT">Keluar (Out)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kuantitas (+/-)</label>
                  <Input type="number" step="0.01" name="quantity" value={formData.quantity} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Harga Satuan (Rp)</label>
                  <Input type="number" step="0.01" name="unitCost" value={formData.unitCost} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Referensi</label>
                <Input name="reference" value={formData.reference} onChange={handleChange} placeholder="No. Dokumen referensi" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan</label>
                <Input name="notes" value={formData.notes} onChange={handleChange} placeholder="Alasan penyesuaian..." />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Menyimpan...' : 'Simpan Penyesuaian'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Penyesuaian Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAdjustments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada data penyesuaian terbaru.</p>
              ) : (
                recentAdjustments.map((m: any) => (
                  <div key={m.id} className="border-b pb-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">{m.product?.name}</span>
                      <span className={m.quantity < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </div>
                    <div className="text-gray-500 flex justify-between">
                      <span>{format(new Date(m.date), 'dd MMM yyyy')} | Ref: {m.reference || '-'}</span>
                      <span>Catatan: {m.notes || '-'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
