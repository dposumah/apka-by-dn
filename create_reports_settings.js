const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\ASUS\\Documents\\APPProject\\BIGproject\\Akuntansi\\apka";

const files = {
  "src/app/(dashboard)/laporan/page.tsx": `'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, FileText, Banknote, List, BookOpen, PenTool } from 'lucide-react';
import Link from 'next/link';

export default function LaporanPage() {
  const reports = [
    { title: 'Laporan Laba Rugi', desc: 'Pendapatan, beban, dan laba perusahaan', icon: BarChart, link: '/laporan/laba-rugi' },
    { title: 'Laporan Posisi Keuangan (Neraca)', desc: 'Aset, liabilitas, dan ekuitas perusahaan', icon: FileText, link: '/laporan/neraca' },
    { title: 'Laporan Arus Kas', desc: 'Penerimaan dan pengeluaran kas', icon: Banknote, link: '/laporan/arus-kas' },
    { title: 'Neraca Saldo', desc: 'Saldo akhir seluruh akun', icon: List, link: '/laporan/neraca-saldo' },
    { title: 'Buku Besar', desc: 'Rincian transaksi per akun', icon: BookOpen, link: '/laporan/buku-besar' },
    { title: 'Catatan Atas Laporan Keuangan', desc: 'Penjelasan rinci pos laporan', icon: PenTool, link: '/laporan/catatan-atas-laporan' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Laporan Keuangan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((r, i) => (
          <Link href={r.link} key={i}>
            <Card className="hover:bg-slate-50 transition-colors h-full">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <r.icon className="w-8 h-8 mr-4 text-blue-600" />
                <CardTitle className="text-lg">{r.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{r.desc}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
`,
  "src/app/(dashboard)/laporan/laba-rugi/page.tsx": `'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';

export default function LabaRugiPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/income-statement?startDate=2024-01-01&endDate=2024-12-31')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  if (loading) return <div className="p-6">Memuat data...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Laba Rugi</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" /> Cetak</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> PDF</Button>
          <Button variant="outline" size="sm"><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel</Button>
        </div>
      </div>
      
      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase">APKA BY DN</h2>
          <h3 className="text-lg font-bold">LAPORAN LABA RUGI</h3>
          <p className="text-sm text-gray-500">Untuk Periode yang Berakhir 31 Desember 2024</p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-700 mb-2">PENDAPATAN</h4>
            <div className="flex justify-between py-1"><span className="pl-4">Penjualan Barang</span><span>{formatIDR(data?.pendapatan || 0)}</span></div>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Total Pendapatan</span><span>{formatIDR(data?.pendapatan || 0)}</span></div>
          </div>

          <div>
            <h4 className="font-bold text-gray-700 mb-2">BEBAN POKOK PENJUALAN</h4>
            <div className="flex justify-between py-1"><span className="pl-4">Harga Pokok Penjualan</span><span>({formatIDR(data?.hpp || 0)})</span></div>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Total Beban Pokok Penjualan</span><span>({formatIDR(data?.hpp || 0)})</span></div>
          </div>

          <div className="flex justify-between py-2 font-bold text-lg border-b border-t border-gray-400">
            <span>LABA KOTOR</span><span>{formatIDR((data?.pendapatan || 0) - (data?.hpp || 0))}</span>
          </div>

          <div>
            <h4 className="font-bold text-gray-700 mb-2">BEBAN OPERASIONAL</h4>
            <div className="flex justify-between py-1"><span className="pl-4">Beban Operasional</span><span>{formatIDR(data?.bebanOperasional || 0)}</span></div>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Total Beban Operasional</span><span>({formatIDR(data?.bebanOperasional || 0)})</span></div>
          </div>

          <div className="flex justify-between py-2 font-bold text-lg border-b-4 border-t border-gray-600">
            <span>LABA BERSIH</span><span>{formatIDR(data?.labaBersih || 0)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
`,
  "src/app/(dashboard)/laporan/neraca/page.tsx": `'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NeracaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/balance-sheet?asOfDate=2024-12-31')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  if (loading) return <div className="p-6">Memuat data...</div>;

  const totalAset = (data?.asetLancar || 0) + (data?.asetTetap || 0);
  const totalLiabilitas = data?.liabilitas || 0;
  const totalEkuitas = data?.ekuitas || 0;
  const totalPasiva = totalLiabilitas + totalEkuitas;
  const isBalanced = totalAset === totalPasiva;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Posisi Keuangan</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" /> Cetak</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> PDF</Button>
        </div>
      </div>
      
      {isBalanced ? (
        <div className="mb-4 flex items-center text-green-600 bg-green-50 p-3 rounded"><CheckCircle2 className="mr-2" /> Neraca Seimbang</div>
      ) : (
        <div className="mb-4 flex items-center text-red-600 bg-red-50 p-3 rounded"><AlertCircle className="mr-2" /> Peringatan: Neraca Tidak Seimbang</div>
      )}

      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase">APKA BY DN</h2>
          <h3 className="text-lg font-bold">LAPORAN POSISI KEUANGAN</h3>
          <p className="text-sm text-gray-500">Per 31 Desember 2024</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="font-bold text-lg border-b mb-4 pb-2">ASET</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-gray-700">Aset Lancar</h5>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Kas dan Setara Kas</span><span>{formatIDR(data?.kas || 0)}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Piutang Usaha</span><span>{formatIDR(data?.piutang || 0)}</span></div>
                <div className="flex justify-between py-1 font-semibold border-t mt-1"><span>Total Aset Lancar</span><span>{formatIDR(data?.asetLancar || 0)}</span></div>
              </div>
              <div>
                <h5 className="font-semibold text-gray-700">Aset Tetap</h5>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Aset Tetap Netto</span><span>{formatIDR(data?.asetTetap || 0)}</span></div>
                <div className="flex justify-between py-1 font-semibold border-t mt-1"><span>Total Aset Tetap</span><span>{formatIDR(data?.asetTetap || 0)}</span></div>
              </div>
            </div>
            <div className="flex justify-between py-3 mt-6 font-bold text-lg border-t-2 border-b-4 border-gray-600">
              <span>TOTAL ASET</span><span>{formatIDR(totalAset)}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg border-b mb-4 pb-2">LIABILITAS DAN EKUITAS</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-gray-700">Liabilitas</h5>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Hutang Usaha</span><span>{formatIDR(data?.hutangUsaha || 0)}</span></div>
                <div className="flex justify-between py-1 font-semibold border-t mt-1"><span>Total Liabilitas</span><span>{formatIDR(totalLiabilitas)}</span></div>
              </div>
              <div>
                <h5 className="font-semibold text-gray-700">Ekuitas</h5>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Modal</span><span>{formatIDR(data?.modal || 0)}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Laba Ditahan</span><span>{formatIDR(data?.labaDitahan || 0)}</span></div>
                <div className="flex justify-between py-1 font-semibold border-t mt-1"><span>Total Ekuitas</span><span>{formatIDR(totalEkuitas)}</span></div>
              </div>
            </div>
            <div className="flex justify-between py-3 mt-6 font-bold text-lg border-t-2 border-b-4 border-gray-600">
              <span>TOTAL LIABILITAS DAN EKUITAS</span><span>{formatIDR(totalPasiva)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
`,
  "src/app/(dashboard)/laporan/arus-kas/page.tsx": `'use client';
import { Card } from '@/components/ui/card';

export default function ArusKasPage() {
  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Laporan Arus Kas</h1>
      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase">APKA BY DN</h2>
          <h3 className="text-lg font-bold">LAPORAN ARUS KAS</h3>
          <p className="text-sm text-gray-500">Untuk Periode yang Berakhir 31 Desember 2024</p>
        </div>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-700 mb-2">ARUS KAS DARI AKTIVITAS OPERASI</h4>
            <div className="flex justify-between py-1"><span className="pl-4">Penerimaan dari Pelanggan</span><span>{formatIDR(50000000)}</span></div>
            <div className="flex justify-between py-1"><span className="pl-4">Pembayaran kepada Supplier</span><span>({formatIDR(20000000)})</span></div>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Arus Kas Bersih dari Aktivitas Operasi</span><span>{formatIDR(30000000)}</span></div>
          </div>
          <div>
            <h4 className="font-bold text-gray-700 mb-2">ARUS KAS DARI AKTIVITAS INVESTASI</h4>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Arus Kas Bersih dari Aktivitas Investasi</span><span>{formatIDR(0)}</span></div>
          </div>
          <div>
            <h4 className="font-bold text-gray-700 mb-2">ARUS KAS DARI AKTIVITAS PENDANAAN</h4>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Arus Kas Bersih dari Aktivitas Pendanaan</span><span>{formatIDR(0)}</span></div>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg border-b border-t border-gray-400">
            <span>KENAIKAN (PENURUNAN) KAS</span><span>{formatIDR(30000000)}</span>
          </div>
          <div className="flex justify-between py-2 text-md">
            <span>SALDO KAS AWAL PERIODE</span><span>{formatIDR(10000000)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg border-b-4 border-gray-600">
            <span>SALDO KAS AKHIR PERIODE</span><span>{formatIDR(40000000)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
`,
  "src/app/(dashboard)/laporan/catatan-atas-laporan/page.tsx": `'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CALKPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catatan Atas Laporan Keuangan</h1>
        <Button>Simpan</Button>
      </div>
      <Card className="p-8 space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-2">1. Umum</h3>
          <textarea className="w-full p-2 border rounded" rows={4} defaultValue="Perusahaan berdiri pada tahun 2024 dan bergerak di bidang perdagangan umum."></textarea>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">2. Kebijakan Akuntansi</h3>
          <textarea className="w-full p-2 border rounded" rows={4} defaultValue="Laporan keuangan disusun berdasarkan SAK EMKM. Penilaian persediaan menggunakan metode Moving Average."></textarea>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">3. Penjelasan Pos-pos Laporan Keuangan</h3>
          <textarea className="w-full p-2 border rounded" rows={4} defaultValue="Kas terdiri dari kas di tangan dan saldo bank."></textarea>
        </div>
      </Card>
    </div>
  );
}
`,
  "src/app/api/reports/income-statement/route.ts": `import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({
    pendapatan: 100000000,
    hpp: 40000000,
    bebanOperasional: 20000000,
    labaBersih: 40000000
  });
}
`,
  "src/app/api/reports/balance-sheet/route.ts": `import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({
    kas: 50000000,
    piutang: 10000000,
    asetLancar: 60000000,
    asetTetap: 40000000,
    hutangUsaha: 20000000,
    liabilitas: 20000000,
    modal: 60000000,
    labaDitahan: 20000000,
    ekuitas: 80000000
  });
}
`,
  "src/app/api/reports/cash-flow/route.ts": `import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ success: true });
}
`,
  "src/app/(dashboard)/pengaturan/page.tsx": `import { redirect } from 'next/navigation';

export default function PengaturanPage() {
  redirect('/pengaturan/perusahaan');
}
`,
  "src/app/(dashboard)/pengaturan/layout.tsx": `import Link from 'next/link';

export default function PengaturanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pengaturan</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex flex-col gap-2">
          <Link href="/pengaturan/perusahaan" className="p-2 hover:bg-slate-100 rounded">Perusahaan</Link>
          <Link href="/pengaturan/pengguna" className="p-2 hover:bg-slate-100 rounded">Pengguna</Link>
          <Link href="/pengaturan/pajak" className="p-2 hover:bg-slate-100 rounded">Pajak</Link>
          <Link href="/pengaturan/periode" className="p-2 hover:bg-slate-100 rounded">Periode Akuntansi</Link>
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
`,
  "src/app/(dashboard)/pengaturan/perusahaan/page.tsx": `'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PerusahaanPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Perusahaan</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Perusahaan</label>
            <input type="text" className="w-full p-2 border rounded" defaultValue="APKA BY DN" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alamat</label>
            <textarea className="w-full p-2 border rounded" rows={3}></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NPWP</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>
          <Button>Simpan Perubahan</Button>
        </form>
      </CardContent>
    </Card>
  );
}
`,
  "src/app/(dashboard)/pengaturan/pengguna/page.tsx": `'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PenggunaPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Manajemen Pengguna</CardTitle>
        <Button>Tambah Pengguna</Button>
      </CardHeader>
      <CardContent>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Nama</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">Admin User</td>
              <td className="p-2">admin@apka.com</td>
              <td className="p-2"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">ADMIN</span></td>
              <td className="p-2">
                <Button variant="outline" size="sm">Edit</Button>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
`,
  "src/app/(dashboard)/pengaturan/pajak/page.tsx": `'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PajakPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Pengaturan Pajak</CardTitle>
        <Button>Tambah Pajak</Button>
      </CardHeader>
      <CardContent>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Nama</th>
              <th className="text-left p-2">Tarif (%)</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">PPN</td>
              <td className="p-2">11%</td>
              <td className="p-2">Aktif</td>
              <td className="p-2"><Button variant="outline" size="sm">Edit</Button></td>
            </tr>
            <tr className="border-b">
              <td className="p-2">PPh Final 0.5%</td>
              <td className="p-2">0.5%</td>
              <td className="p-2">Aktif</td>
              <td className="p-2"><Button variant="outline" size="sm">Edit</Button></td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
`,
  "src/app/(dashboard)/pengaturan/periode/page.tsx": `'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PeriodePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Periode Akuntansi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="mb-2">Periode Aktif: <strong>Januari 2024 - Desember 2024</strong></p>
          <Button variant="destructive">Tutup Buku</Button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Nama Periode</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">Tahun 2024</td>
              <td className="p-2">Berjalan</td>
            </tr>
            <tr className="border-b text-gray-500">
              <td className="p-2">Tahun 2023</td>
              <td className="p-2">Ditutup</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
`,
  "src/app/api/settings/route.ts": `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ name: 'APKA BY DN' });
}
`,
  "src/app/api/users/route.ts": `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([]);
}
export async function POST(request: Request) {
  return NextResponse.json({ success: true });
}
`,
  "src/app/api/users/[id]/route.ts": `import { NextResponse } from 'next/server';

export async function GET() { return NextResponse.json({}); }
export async function PUT() { return NextResponse.json({}); }
export async function DELETE() { return NextResponse.json({}); }
`
};

Object.entries(files).forEach(([file, content]) => {
  const fullPath = path.join(rootDir, file);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
  console.log('Created:', fullPath);
});
