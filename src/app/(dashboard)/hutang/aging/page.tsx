'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function AgingHutangPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Umur Hutang (Aging AP)</h1>
        <Button variant="outline">Export ke Excel</Button>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Belum Jatuh Tempo</p>
          <p className="text-xl font-bold text-gray-800">Rp 0</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">1-30 Hari</p>
          <p className="text-xl font-bold text-yellow-600">Rp 0</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">31-60 Hari</p>
          <p className="text-xl font-bold text-orange-600">Rp 0</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">61-90 Hari</p>
          <p className="text-xl font-bold text-red-500">Rp 0</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">&gt; 90 Hari</p>
          <p className="text-xl font-bold text-red-700">Rp 0</p>
        </div>
      </div>

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Total Hutang</TableHead>
              <TableHead className="text-right">Belum Jatuh Tempo</TableHead>
              <TableHead className="text-right">1-30 Hari</TableHead>
              <TableHead className="text-right">31-60 Hari</TableHead>
              <TableHead className="text-right">61-90 Hari</TableHead>
              <TableHead className="text-right">&gt; 90 Hari</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-gray-500">Data belum tersedia.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
