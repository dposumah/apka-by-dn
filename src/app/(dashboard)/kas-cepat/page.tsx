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
import { uploadFileClient } from '@/lib/upload-client';

type Account = { id: string; code: string; name: string; type: string };

const friendlyLabels: Record<string, string> = {
  // PENGELUARAN (OUT)
  '600.10.001': '💰 Gaji & Honor Karyawan',
  '600.10.003': '🍽️ Konsumsi / Uang Makan Staf',
  '600.10.004': '🚗 Bensin, Transportasi & E-toll',
  '600.10.005': '🎁 THR Karyawan',
  '600.10.008': '📝 Biaya Operasional Kantor',
  '600.10.009': '🏛️ Tunjangan Pajak PPh 21',
  '600.10.010': '✏️ Alat Tulis Kantor (ATK)',
  '600.10.011': '🖨️ Percetakan / Cetak Banner',
  '600.10.012': '🔧 Perbaikan / Pemeliharaan Kantor',
  '600.10.013': '🛠️ Pemeliharaan Inventaris & Robot',
  '600.10.015': '💡 Biaya Listrik',
  '600.10.018': '📦 Pengiriman Paket & Kurir',
  '600.10.019': '🏢 Sewa Kantor / Tempat',
  '600.10.020': '📢 Iklan, Promo & Domain Web',
  '600.10.021': '⚖️ Konsultan / Notaris / Legal',
  '600.10.022': '☕ Makan & Minum Harian',
  '600.10.023': '🤝 Biaya Jamuan / Entertain',
  '600.10.024': '🧹 Iuran Kebersihan & Keamanan',
  '600.10.026': '✈️ Perjalanan Dinas & Tiket',
  '600.10.027': '🎪 Biaya Event & Acara',
  '600.10.028': '👔 Biaya Seragam & Kaos',
  '600.10.029': '🎀 Souvenir, Bunga & Hamper',
  '600.10.030': '↩️ Pengembalian Dana',
  '600.10.031': '⚡ PLN, PAM, Wifi & Token Listrik',
  '600.10.032': '🧳 Paket Perjalanan Lengkap (Transport/Hotel/Honor)',
  '600.10.034': '📚 Pelatihan & Kegiatan KKA',
  '600.10.035': '📑 Pembuatan Proposal & Hak Paten',
  '600.10.038': '🏠 Biaya IPL / Properti',
  '600.10.099': '🔍 Biaya Lainnya',
  '500.10.102': '🤖 Pembelian Bahan / Sample Robot',
  '204.10.101': '💳 Pembayaran Kartu Kredit / Ibu Jully',
  '117.10.101': '🖥️ Pembelian Inventaris / Aset Kantor',
  '700.10.101': '🏦 Biaya Administrasi Bank',

  // PEMASUKAN (IN)
  '400.10.101': '🎓 Uang Kursus / Ekstrakulikuler Sekolah',
  '400.10.102': '🤖 Penjualan Unit Robot',
  '400.10.104': '🎯 Jasa Penyelenggaraan Acara',
  '300.10.101': '💵 Setoran Modal Pemilik',
  '113.12.101': '🔄 Pengembalian Piutang Karyawan',
  '113.13.101': '🔄 Pengembalian Piutang Lainnya',
};

export default function KasCepatPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
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
        const accs: Account[] = data.accounts || data;
        setAllAccounts(accs);
        
        // Filter kas/bank for source/destination (exclude header 111.00.000)
        const banks = accs.filter(a => a.code.startsWith('111') && a.code !== '111.00.000');
        setBankAccounts(banks);
        
        // Auto-select BCA (111.11.101) by default
        const bca = banks.find(b => b.code === '111.11.101');
        if (bca) {
          setBankAccountId(bca.id);
        } else if (banks.length > 0) {
          setBankAccountId(banks[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Filter categories based on transaction type (IN vs OUT)
  const categoryAccounts = allAccounts.filter(a => {
    if (type === 'IN') {
      return a.type === 'REVENUE' || a.type === 'EQUITY' || a.code.startsWith('113');
    } else {
      return a.type === 'EXPENSE' || a.code === '204.10.101' || a.code === '117.10.101';
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return null;
    
    setUploading(true);
    try {
      const url = await uploadFileClient(file, 'receipts');
      return url;
    } catch (error: any) {
      toast({
        title: "Upload Gagal",
        description: error.message || "Gagal mengunggah file",
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
      toast({ title: "Validasi", description: "Harap lengkapi semua kolom wajib (Nominal tidak boleh 0)", type: "error" });
      return;
    }

    setLoading(true);
    
    // Upload file if exists
    let uploadedUrl = attachmentUrl;
    if (file && !attachmentUrl) {
      const url = await handleUpload();
      if (!url) {
        setLoading(false);
        return;
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
        toast({ title: "Sukses", description: "Transaksi berhasil dicatat ke sistem akuntansi", type: "success" });
        // Reset form
        setAmount(0);
        setDescription('');
        setFile(null);
        setAttachmentUrl('');
        setAccountId('');
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
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pencatatan Kas Cepat</h1>
          <p className="text-muted-foreground text-sm">Catat uang masuk atau keluar dengan mudah tanpa perlu memahami debit/kredit.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          type="button"
          onClick={() => { setType('IN'); setAccountId(''); }}
          className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-xl border-2 transition-all ${type === 'IN' ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' : 'border-slate-200 bg-white hover:border-green-300'}`}
        >
          <ArrowDownRight className="h-8 w-8 md:h-10 md:w-10 mb-2 text-green-600" />
          <span className="font-semibold text-base md:text-lg">Uang Masuk</span>
          <span className="text-xs md:text-sm opacity-70">Uang Kursus, Event, Modal</span>
        </button>
        <button 
          type="button"
          onClick={() => { setType('OUT'); setAccountId(''); }}
          className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-xl border-2 transition-all ${type === 'OUT' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-slate-200 bg-white hover:border-red-300'}`}
        >
          <ArrowUpRight className="h-8 w-8 md:h-10 md:w-10 mb-2 text-red-600" />
          <span className="font-semibold text-base md:text-lg">Uang Keluar</span>
          <span className="text-xs md:text-sm opacity-70">Gaji, Bensin, Operasional</span>
        </button>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Transaksi</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <Label>Rekening {type === 'IN' ? 'Tujuan (Masuk)' : 'Sumber Dana (Keluar)'}</Label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger><SelectValue placeholder="Pilih Rekening Kas/Bank" /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Nominal (Rp)</Label>
                <CurrencyInput value={amount} onChange={setAmount} placeholder="0" />
              </div>

              <div className="space-y-2">
                <Label>Kategori {type === 'IN' ? 'Pemasukan' : 'Pengeluaran'}</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="-- Pilih Kategori Pengeluaran/Pemasukan --" /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {categoryAccounts.map(a => {
                      const friendly = friendlyLabels[a.code] || `${a.name}`;
                      return (
                        <SelectItem key={a.id} value={a.id}>
                          {friendly} <span className="text-xs text-muted-foreground ml-1">({a.code})</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keterangan Transaksi</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'OUT' ? "Contoh: Beli bensin mobil Grand Max kantor & e-toll" : "Contoh: Pembayaran kursus robotic dari Sekolah Harapan Bangsa"} 
                rows={3} 
                required 
              />
            </div>

            <div className="space-y-2 p-4 border border-dashed rounded-lg bg-slate-50">
              <Label className="flex items-center gap-2 mb-2 font-medium">
                <FileText className="h-4 w-4 text-blue-600" /> Bukti Transaksi / Nota (Opsional)
              </Label>
              
              {attachmentUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded border border-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium flex-1">File berhasil diunggah</span>
                  <a href={attachmentUrl} target="_blank" rel="noreferrer" className="text-sm underline font-medium">Lihat File</a>
                  <Button type="button" variant="outline" size="sm" onClick={() => {setAttachmentUrl(''); setFile(null)}}>Ganti</Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="bg-white" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Foto struk, nota, atau bukti transfer (JPG, PNG, PDF).</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={loading || uploading} size="lg" className="w-full sm:w-auto font-semibold">
                {loading || uploading ? 'Menyimpan...' : 'Simpan Transaksi'}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
