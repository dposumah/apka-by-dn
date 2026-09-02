'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Users, Plus, Pencil, Trash2, KeyRound } from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function PenggunaPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setIsEditing(false);
    setEditingId('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('STAFF');
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setIsEditing(true);
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // leave blank unless changing
    setRole(user.role);
    setIsDialogOpen(true);
  };

  const confirmDelete = (id: string) => {
    setEditingId(id);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    if (!isEditing && !password) {
      toast({ title: "Validasi", description: "Password wajib diisi untuk pengguna baru", type: "error" });
      return;
    }

    setSubmitting(true);
    const url = isEditing ? `/api/users/${editingId}` : '/api/users';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: "Sukses", description: `Pengguna berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}`, type: "success" });
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Terjadi kesalahan');
      }
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editingId}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        toast({ title: "Sukses", description: "Pengguna berhasil dihapus", type: "success" });
        setIsDeleteOpen(false);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Terjadi kesalahan');
      }
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
            <p className="text-muted-foreground">Kelola staf dan admin yang memiliki akses ke aplikasi.</p>
          </div>
        </div>
        <Button onClick={openAddDialog} className="flex gap-2">
          <Plus className="h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-md border-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Email / Username</TableHead>
                  <TableHead>Hak Akses</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Memuat daftar pengguna...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Tidak ada data pengguna.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className={user.role === 'ADMIN' ? 'bg-indigo-600' : ''}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => confirmDelete(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
              <DialogDescription>
                Berikan akses masuk ke aplikasi dengan mengisi detail di bawah.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Contoh: Budi Santoso" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Alamat Email (Sebagai Username)</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="budi@perusahaan.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Kata Sandi {isEditing && <span className="text-xs text-muted-foreground font-normal">(Kosongkan jika tidak ingin mengubah)</span>}
                </Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type="text" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required={!isEditing}
                    placeholder={isEditing ? "••••••••" : "Buat kata sandi..."}
                    className="pr-10"
                  />
                  <KeyRound className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hak Akses (Role)</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ADMIN - Akses Penuh (Pengaturan & Laporan)</SelectItem>
                    <SelectItem value="STAFF">STAFF - Akses Terbatas (Input Transaksi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Pengguna?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengguna tidak akan bisa login lagi ke aplikasi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
