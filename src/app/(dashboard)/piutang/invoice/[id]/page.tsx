'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Memuat data...</div>;
  if (!invoice) return <div className="p-6">Invoice tidak ditemukan.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Detail Invoice {invoice.number}</h1>
        <div className="space-x-2">
          {invoice.status === 'DRAFT' && <Button variant="outline">Edit</Button>}
          <Button variant="outline" onClick={() => window.print()}>Cetak</Button>
          <Button>Catat Pembayaran</Button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow p-8 print:shadow-none print:p-0">
        <div className="flex justify-between mb-8 border-b pb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
            <p className="text-gray-500 mt-2">No. {invoice.number}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold">APKA by DN</h3>
            <p className="text-sm text-gray-600">Jl. Contoh Perusahaan No. 123</p>
            <p className="text-sm text-gray-600">Jakarta, Indonesia</p>
          </div>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Ditagihkan Kepada:</h4>
            <p className="font-bold">{invoice.customer?.nama}</p>
            <p className="text-sm text-gray-600">{invoice.customer?.alamat}</p>
            <p className="text-sm text-gray-600">{invoice.customer?.telepon}</p>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <span className="text-gray-600">Tanggal Invoice: </span>
              <span className="font-semibold">{new Date(invoice.date).toLocaleDateString('id-ID')}</span>
            </div>
            <div>
              <span className="text-gray-600">Jatuh Tempo: </span>
              <span className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2">Deskripsi</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Harga (Rp)</th>
              <th className="text-right py-2">Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, i: number) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-2">{item.description} {item.hasPpn && <span className="text-xs text-blue-500">(+PPN)</span>}</td>
                <td className="text-center py-2">{item.qty}</td>
                <td className="text-right py-2">{item.price.toLocaleString('id-ID')}</td>
                <td className="text-right py-2">{(item.qty * item.price).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span>Rp {invoice.subtotal?.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">PPN:</span>
              <span>Rp {invoice.ppnTotal?.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>Rp {invoice.total?.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mb-8">
            <h4 className="font-semibold mb-2">Catatan:</h4>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
