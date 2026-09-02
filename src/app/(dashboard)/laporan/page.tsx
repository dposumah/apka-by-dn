'use client';
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
