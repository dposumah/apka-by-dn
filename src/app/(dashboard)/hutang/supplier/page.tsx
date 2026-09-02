'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Supplier {
  id: string;
  nama: string;
  telepon: string;
  email: string;
  npwp: string;
  alamat: string;
  saldoHutang: number;
}

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nama: '', alamat: '', telepon: '', email: '', npwp: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsOpen(false);
        fetchSuppliers();
        setFormData({ nama: '', alamat: '', telepon: '', email: '', npwp: '' });
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Supplier</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Supplier</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Supplier Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nama</label>
                <Input value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Alamat</label>
                <Input value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Telepon</label>
                <Input value={formData.telepon} onChange={e => setFormData({...formData, telepon: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium">NPWP</label>
                <Input value={formData.npwp} onChange={e => setFormData({...formData, npwp: e.target.value})} />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Cari supplier..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>NPWP</TableHead>
              <TableHead>Saldo Hutang</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.nama}</TableCell>
                <TableCell>{s.telepon}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.npwp}</TableCell>
                <TableCell>{s.saldoHutang ? `Rp ${s.saldoHutang.toLocaleString('id-ID')}` : 'Rp 0'}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">Tidak ada data supplier.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
