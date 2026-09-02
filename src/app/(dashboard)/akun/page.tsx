'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import AccountForm from './components/AccountForm';
import { useToast } from '@/components/ui/toast';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  subType: string | null;
  normalBalance: 'DEBIT' | 'CREDIT';
  isActive: boolean;
  parentId: string | null;
  level: number;
}

const ACCOUNT_TYPES = [
  { value: 'ALL', label: 'Semua' },
  { value: 'ASSET', label: 'Aset' },
  { value: 'LIABILITY', label: 'Liabilitas' },
  { value: 'EQUITY', label: 'Ekuitas' },
  { value: 'REVENUE', label: 'Pendapatan' },
  { value: 'EXPENSE', label: 'Beban' },
];

export default function BaganAkunPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const { toast } = useToast();

  const fetchAccounts = async (type = 'ALL', search = '') => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (type !== 'ALL') query.append('type', type);
      if (search) query.append('search', search);

      const response = await fetch(`/api/accounts?${query.toString()}`);
      if (!response.ok) throw new Error('Gagal memuat data akun');
      
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data akun",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(activeTab, searchTerm);
  }, [activeTab]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAccounts(activeTab, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;
    
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menghapus akun');
      }
      
      toast({
        title: "Sukses",
        description: "Akun berhasil dihapus",
      });
      fetchAccounts(activeTab, searchTerm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (account: Account) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedAccount(null);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    fetchAccounts(activeTab, searchTerm);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ASSET': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LIABILITY': return 'bg-red-100 text-red-800 border-red-200';
      case 'EQUITY': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REVENUE': return 'bg-green-100 text-green-800 border-green-200';
      case 'EXPENSE': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Bagan Akun</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Akun
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedAccount ? 'Edit Akun' : 'Tambah Akun Baru'}</DialogTitle>
            </DialogHeader>
            <AccountForm 
              initialData={selectedAccount} 
              onSuccess={handleSuccess}
              accounts={accounts} // pass all accounts for parent selection
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="p-4 pb-0">
          <Tabs defaultValue="ALL" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList className="overflow-x-auto">
                {ACCOUNT_TYPES.map(type => (
                  <TabsTrigger key={type.value} value={type.value}>
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <form onSubmit={handleSearchSubmit} className="flex w-full sm:w-auto items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Cari kode atau nama..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <Button type="submit" variant="secondary" size="sm">Cari</Button>
              </form>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Saldo Normal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Tidak ada akun ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.code}</TableCell>
                    <TableCell>
                      <div style={{ paddingLeft: `${(account.level || 0) * 1.5}rem` }}>
                        {account.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeBadgeColor(account.type)}>
                        {ACCOUNT_TYPES.find(t => t.value === account.type)?.label || account.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {account.normalBalance === 'DEBIT' ? 'Debit' : 'Kredit'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>
                        {account.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
