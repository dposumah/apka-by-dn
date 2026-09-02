'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PembayaranPiutangPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch payments from API
    // fetch('/api/payments').then(...)
    setLoading(false);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pembayaran Piutang</h1>
        <Button>Catat Pembayaran</Button>
      </div>

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Pembayaran</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-4">Memuat data...</TableCell></TableRow>
            ) : payments.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-4">Belum ada data pembayaran.</TableCell></TableRow>
            ) : (
              payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.number}</TableCell>
                  <TableCell>{p.invoiceNumber}</TableCell>
                  <TableCell>{p.customerName}</TableCell>
                  <TableCell>{p.date}</TableCell>
                  <TableCell>Rp {p.amount.toLocaleString('id-ID')}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Detail</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
