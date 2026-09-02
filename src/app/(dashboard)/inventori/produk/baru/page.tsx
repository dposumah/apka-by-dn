'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TambahProdukPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    type: 'GOODS',
    unitOfMeasure: 'Pcs',
    purchasePrice: 0,
    sellingPrice: 0,
    minStock: 0,
    stockQuantity: 0,
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSKU = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, sku: `PRD-${random}` }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    // Auto generate SKU if empty
    let payload = { ...formData };
    if (!payload.sku) {
      payload.sku = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        router.push('/inventori/produk');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const isBarang = formData.type === 'GOODS';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tambah Produk / Jasa</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="GOODS">Barang (Inventory)</option>
                  <option value="SERVICE">Jasa (Non-Inventory)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU (Kosongkan untuk auto-generate)</label>
                <div className="flex space-x-2">
                  <Input name="sku" value={formData.sku} onChange={handleChange} placeholder="PRD-0001" />
                  <Button type="button" variant="outline" onClick={generateSKU}>Generate</Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Produk *</label>
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <Input name="category" value={formData.category} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Satuan (UoM)</label>
                <Input name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Beli (Rp)</label>
                <Input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Jual (Rp)</label>
                <Input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} />
              </div>
            </div>

            {isBarang && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Stok Awal</label>
                  <Input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Batas Minimum Stok</label>
                  <Input type="number" name="minStock" value={formData.minStock} onChange={handleChange} />
                </div>
              </div>
            )}

            <div className="pt-4 flex space-x-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Produk'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/inventori/produk')}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
