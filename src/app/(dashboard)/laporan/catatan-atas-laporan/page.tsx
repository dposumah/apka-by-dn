'use client';
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
