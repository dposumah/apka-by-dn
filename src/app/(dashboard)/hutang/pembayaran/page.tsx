'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PembayaranHutangPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch bill payments from API
    // fetch('/api/bill-payments').then(...)
    setLoading(false);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pembayaran Hutang (Bill Payments)</h1>
        <Button>Catat Pembayaran</Button>
      </div>

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Pembayaran</TableHead>
              <TableHead>Tagihan</TableHead>
              <TableHead>Supplier</TableHead>
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
              <TableRow><TableCell colSpan={7} className="text-center py-4">Belum ada data pembayaran hutang.</TableCell></TableRow>
            ) : (
              payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.number}</TableCell>
                  <TableCell>{p.billNumber}</TableCell>
                  <TableCell>{p.supplierName}</TableCell>
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
