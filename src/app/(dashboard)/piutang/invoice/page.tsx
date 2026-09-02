'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Invoice {
  id: string;
  number: string;
  customerName: string;
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  status: string;
}

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
      'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      'SENT': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terkirim' },
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

  const filteredInvoices = invoices.filter(i => 
    i.number.toLowerCase().includes(search.toLowerCase()) ||
    i.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoice Penjualan</h1>
        <Link href="/piutang/invoice/baru">
          <Button>Buat Invoice Baru</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Cari nomor invoice atau pelanggan..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Pelanggan</TableHead>
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
            ) : filteredInvoices.map(i => {
              const sisa = i.total - (i.paidAmount || 0);
              return (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.number}</TableCell>
                  <TableCell>{i.customerName}</TableCell>
                  <TableCell>{new Date(i.date).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{new Date(i.dueDate).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>Rp {i.total.toLocaleString('id-ID')}</TableCell>
                  <TableCell>Rp {(i.paidAmount || 0).toLocaleString('id-ID')}</TableCell>
                  <TableCell>Rp {sisa.toLocaleString('id-ID')}</TableCell>
                  <TableCell>{getStatusBadge(i.status)}</TableCell>
                  <TableCell>
                    <Link href={`/piutang/invoice/${i.id}`}>
                      <Button variant="outline" size="sm">Detail</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && filteredInvoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">Tidak ada data invoice.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
