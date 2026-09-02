'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatRupiah } from '@/lib/utils'; // Assuming a utility exists

interface Customer {
  id: string;
  nama: string;
  telepon: string;
  email: string;
  npwp: string;
  alamat: string;
  batasKredit: number;
  saldoPiutang: number;
  status: string;
}

export default function PelangganPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nama: '', alamat: '', telepon: '', email: '', npwp: '', batasKredit: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsOpen(false);
        fetchCustomers();
        setFormData({ nama: '', alamat: '', telepon: '', email: '', npwp: '', batasKredit: 0 });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.nama.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pelanggan</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Pelanggan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
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
              <div>
                <label className="block text-sm font-medium">Batas Kredit</label>
                <Input type="number" value={formData.batasKredit} onChange={e => setFormData({...formData, batasKredit: Number(e.target.value)})} />
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
          placeholder="Cari pelanggan..." 
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
              <TableHead>Saldo Piutang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nama}</TableCell>
                <TableCell>{c.telepon}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.npwp}</TableCell>
                <TableCell>{c.saldoPiutang ? `Rp ${c.saldoPiutang.toLocaleString('id-ID')}` : 'Rp 0'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.status || 'Aktif'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">Tidak ada data pelanggan.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
