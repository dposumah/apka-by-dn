'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProdukPage() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?type=${filter}&search=${search}`);
      const data = await res.json();
      setProducts(data);
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
        <h1 className="text-3xl font-bold">Produk & Jasa</h1>
        <Button asChild>
          <Link href="/inventori/produk/baru">Tambah Produk</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
          <div className="flex space-x-4 mt-4">
            <Input 
              placeholder="Cari nama atau SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              className="max-w-sm"
            />
            <Button variant={filter === 'ALL' ? 'default' : 'outline'} onClick={() => setFilter('ALL')}>Semua</Button>
            <Button variant={filter === 'GOODS' ? 'default' : 'outline'} onClick={() => setFilter('GOODS')}>Barang</Button>
            <Button variant={filter === 'SERVICE' ? 'default' : 'outline'} onClick={() => setFilter('SERVICE')}>Jasa</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Satuan</th>
                    <th className="px-4 py-3 text-right">Harga Beli</th>
                    <th className="px-4 py-3 text-right">Harga Jual</th>
                    <th className="px-4 py-3 text-right">Stok</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{p.sku}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{p.category || '-'}</td>
                      <td className="px-4 py-3">{p.unitOfMeasure}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(p.purchasePrice)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(p.sellingPrice)}</td>
                      <td className="px-4 py-3 text-right">
                        {p.type === 'SERVICE' ? '-' : (
                          <span className={p.stockQuantity < p.minStock ? 'text-red-600 font-bold' : ''}>
                            {p.stockQuantity}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {p.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="text-center py-8 text-gray-500">Tidak ada produk ditemukan.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
