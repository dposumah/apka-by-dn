'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Supplier {
  id: string;
  nama: string;
}

export default function BuatTagihanPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ description: '', qty: 1, price: 0, hasPpn: false }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', qty: 1, price: 0, hasPpn: false }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let ppnTotal = 0;

    items.forEach(item => {
      const lineTotal = item.qty * item.price;
      subtotal += lineTotal;
      if (item.hasPpn) {
        ppnTotal += lineTotal * 0.11;
      }
    });

    return { subtotal, ppnTotal, total: subtotal + ppnTotal };
  };

  const { subtotal, ppnTotal, total } = calculateTotals();

  const handleSubmit = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId, date, dueDate, notes, items, subtotal, ppnTotal, total, status
        }),
      });
      if (res.ok) {
        router.push('/hutang/tagihan');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Buat Tagihan (Bill) Baru</h1>
      
      <div className="bg-white rounded-md shadow p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Supplier</label>
            <select 
              className="w-full border-gray-300 rounded-md shadow-sm border p-2" 
              value={supplierId} 
              onChange={e => setSupplierId(e.target.value)}
              required
            >
              <option value="">Pilih Supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
          </div>
          <div></div>
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Tagihan</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Jatuh Tempo</label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Item Tagihan</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-48">Harga Satuan (Rp)</TableHead>
                <TableHead className="w-24">PPN 11%</TableHead>
                <TableHead className="w-48">Jumlah</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const lineTotal = item.qty * item.price;
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Input value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="1" value={item.qty} onChange={e => updateItem(index, 'qty', Number(e.target.value))} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="0" value={item.price} onChange={e => updateItem(index, 'price', Number(e.target.value))} />
                    </TableCell>
                    <TableCell className="text-center">
                      <input type="checkbox" checked={item.hasPpn} onChange={e => updateItem(index, 'hasPpn', e.target.checked)} />
                    </TableCell>
                    <TableCell>Rp {lineTotal.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => removeItem(index)}>Hapus</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <Button variant="outline" className="mt-4" onClick={addItem}>Tambah Item</Button>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>PPN (11%):</span>
              <span>Rp {ppnTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Catatan</label>
          <textarea 
            className="w-full border-gray-300 rounded-md shadow-sm border p-2 h-24" 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => handleSubmit('DRAFT')} disabled={loading}>
            Simpan Draft
          </Button>
          <Button onClick={() => handleSubmit('RECEIVED')} disabled={loading}>
            Simpan Tagihan
          </Button>
        </div>
      </div>
    </div>
  );
}
