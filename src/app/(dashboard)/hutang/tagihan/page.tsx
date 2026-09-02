'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Bill {
  id: string;
  number: string;
  supplierName: string;
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  status: string;
}

export default function TagihanPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/bills');
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
      'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      'RECEIVED': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Diterima' },
      'PARTIAL': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Dibayar Sebagian' },
      'PAID': { bg: 'bg-green-100', text: 'text-green-800', label: 'Lunas' },
      'OVERDUE': { bg: 'bg-red-100', text: 'text-red-800', label: 'Jatuh Tempo' },
    };
    
    const config = statusConfig[status] || statusConfig['DRAFT'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredBills = bills.filter(b => 
    b.number.toLowerCase().includes(search.toLowerCase()) ||
    b.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tagihan Pembelian (Bills)</h1>
        <Link href="/hutang/tagihan/baru">
          <Button>Buat Tagihan Baru</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Cari nomor tagihan atau supplier..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Tagihan</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Dibayar</TableHead>
              <TableHead>Sisa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-4">Memuat data...</TableCell></TableRow>
            ) : filteredBills.map(b => {
              const sisa = b.total - (b.paidAmount || 0);
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.number}</TableCell>
                  <TableCell>{b.supplierName}</TableCell>
                  <TableCell>{new Date(b.date).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{new Date(b.dueDate).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>Rp {b.total.toLocaleString('id-ID')}</TableCell>
                  <TableCell>Rp {(b.paidAmount || 0).toLocaleString('id-ID')}</TableCell>
                  <TableCell>Rp {sisa.toLocaleString('id-ID')}</TableCell>
                  <TableCell>{getStatusBadge(b.status)}</TableCell>
                  <TableCell>
                    <Link href={`/hutang/tagihan/${b.id}`}>
                      <Button variant="outline" size="sm">Detail</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && filteredBills.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">Tidak ada data tagihan.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
