'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, UploadCloud, CheckCircle2, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { parseRupiah, formatCurrency } from '@/lib/format';
import { CurrencyInput } from '@/components/shared/CurrencyInput';

type Account = { id: string; code: string; name: string; type: string };

export default function KasCepatPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  
  const [type, setType] = useState<'IN' | 'OUT'>('OUT');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        const accs = data.accounts || data;
        
        // Filter kas/bank for source/destination
        const banks = accs.filter((a: Account) => a.type === 'ASSET' && a.code.startsWith('11'));
        setBankAccounts(banks);
        
        // Exclude bank accounts from the category list
        const categories = accs.filter((a: Account) => !a.code.startsWith('11'));
        setAccounts(categories);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return null;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Gagal upload file');
      
      return data.url;
    } catch (error: any) {
      toast({
        title: "Upload Gagal",
        description: error.message || "Periksa konfigurasi Supabase Anda",
        type: "error"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountId || !accountId || amount <= 0 || !description) {
      toast({ title: "Validasi", description: "Harap isi semua kolom wajib (Nominal tidak boleh 0)", type: "error" });
      return;
    }

    setLoading(true);
    
    // Upload file if exists
    let uploadedUrl = attachmentUrl;
    if (file && !attachmentUrl) {
      const url = await handleUpload();
      if (!url) {
        setLoading(false);
        return; // stop if upload failed
      }
      uploadedUrl = url;
      setAttachmentUrl(url);
    }

    const payload = {
      type,
      date,
      bankAccountId,
      accountId,
      amount,
      description,
      attachmentUrl: uploadedUrl
    };

    try {
      const res = await fetch('/api/quick-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast({ title: "Sukses", description: "Transaksi berhasil dicatat", type: "success" });
        // Reset form
        setAmount(0);
        setDescription('');
        setFile(null);
        setAttachmentUrl('');
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal menyimpan", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Pencatatan Cepat</h1>
          <p className="text-muted-foreground">Catat pemasukan atau pengeluaran kas dengan bukti lampiran.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button 
          onClick={() => setType('IN')}
          className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${type === 'IN' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 bg-white hover:border-green-300'}`}
        >
          <ArrowDownRight className="h-10 w-10 mb-2" />
          <span className="font-semibold text-lg">Uang Masuk</span>
          <span className="text-sm opacity-70">Pendapatan, Modal, dll</span>
        </button>
        <button 
          onClick={() => setType('OUT')}
          className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${type === 'OUT' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 bg-white hover:border-red-300'}`}
        >
          <ArrowUpRight className="h-10 w-10 mb-2" />
          <span className="font-semibold text-lg">Uang Keluar</span>
          <span className="text-sm opacity-70">Biaya, Belanja, dll</span>
        </button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tanggal Transaksi</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <Label>Rekening {type === 'IN' ? 'Penerima' : 'Pengirim'}</Label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kas/Bank" /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.code} - {b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nominal (Rp)</Label>
                <CurrencyInput value={amount} onChange={setAmount} placeholder="0" />
              </div>

              <div className="space-y-2">
                <Label>Kategori {type === 'IN' ? 'Pemasukan' : 'Pengeluaran'}</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keterangan Lengkap</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Beli token listrik bulan September" 
                rows={3} 
                required 
              />
            </div>

            <div className="space-y-2 p-4 border border-dashed rounded-lg bg-slate-50">
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" /> Bukti Transaksi (Opsional)
              </Label>
              
              {attachmentUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded border border-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium flex-1">File berhasil diunggah</span>
                  <a href={attachmentUrl} target="_blank" rel="noreferrer" className="text-sm underline">Lihat File</a>
                  <Button type="button" variant="outline" size="sm" onClick={() => {setAttachmentUrl(''); setFile(null)}}>Ganti</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="bg-white" />
                  <span className="text-xs text-muted-foreground">Maks 5MB. Format JPG, PNG, PDF.</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={loading || uploading} size="lg" className="w-full sm:w-auto">
                {loading || uploading ? 'Memproses...' : 'Simpan Transaksi'}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
