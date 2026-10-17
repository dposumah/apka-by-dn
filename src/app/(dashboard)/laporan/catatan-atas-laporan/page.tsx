'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Save, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function CALKPage() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('PT JULLY TJINDRAWAN ROBOTIK');
  const [sec1, setSec1] = useState(
    'PT Jully Tjindrawan Robotik bergerak di bidang pelatihan, pendidikan, kursus robotika, penyediaan modul/robot kit, dan penyelenggaraan acara edukasi teknologi.'
  );
  const [sec2, setSec2] = useState(
    'Laporan keuangan disusun berdasarkan Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) dengan basis kas dan akrual modifikasi.'
  );
  const [sec3, setSec3] = useState(
    'Kas dan setara kas terdiri dari rekening operasional Bank BCA. Pendapatan diakui saat jasa kursus, ekstrakulikuler, atau acara diselenggarakan.'
  );

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d?.name) setCompanyName(d.name); })
      .catch(() => {});

    const saved1 = localStorage.getItem('calk_sec1');
    const saved2 = localStorage.getItem('calk_sec2');
    const saved3 = localStorage.getItem('calk_sec3');
    if (saved1) setSec1(saved1);
    if (saved2) setSec2(saved2);
    if (saved3) setSec3(saved3);
  }, []);

  const handleSave = () => {
    localStorage.setItem('calk_sec1', sec1);
    localStorage.setItem('calk_sec2', sec2);
    localStorage.setItem('calk_sec3', sec3);
    toast({
      title: 'Sukses',
      description: 'Catatan atas laporan keuangan berhasil disimpan',
      type: 'success'
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Catatan Atas Laporan Keuangan (CALK)</h1>
          <p className="text-sm text-muted-foreground">Penjelasan naratif mengenai profil dan kebijakan akuntansi perusahaan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Cetak / PDF
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> Simpan Catatan
          </Button>
        </div>
      </div>

      <Card className="p-6 md:p-10 bg-white border shadow-sm print:border-none print:shadow-none space-y-6">
        <div className="text-center mb-8 border-b pb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">{companyName}</h2>
          <h3 className="text-lg font-bold text-gray-700 mt-1">CATATAN ATAS LAPORAN KEUANGAN</h3>
          <p className="text-sm text-gray-500 mt-1">Tahun Buku 2026</p>
        </div>

        <div className="space-y-6 text-sm">
          <div>
            <h3 className="font-bold text-base text-gray-900 mb-2">1. Gambaran Umum Perusahaan</h3>
            <textarea
              className="w-full p-3 border rounded-md text-sm leading-relaxed focus:ring-1 focus:ring-blue-500 print:border-none print:p-0 print:resize-none"
              rows={3}
              value={sec1}
              onChange={e => setSec1(e.target.value)}
            />
          </div>

          <div>
            <h3 className="font-bold text-base text-gray-900 mb-2">2. Kebijakan Akuntansi Penting</h3>
            <textarea
              className="w-full p-3 border rounded-md text-sm leading-relaxed focus:ring-1 focus:ring-blue-500 print:border-none print:p-0 print:resize-none"
              rows={3}
              value={sec2}
              onChange={e => setSec2(e.target.value)}
            />
          </div>

          <div>
            <h3 className="font-bold text-base text-gray-900 mb-2">3. Penjelasan Pos-Pos Signifikan</h3>
            <textarea
              className="w-full p-3 border rounded-md text-sm leading-relaxed focus:ring-1 focus:ring-blue-500 print:border-none print:p-0 print:resize-none"
              rows={3}
              value={sec3}
              onChange={e => setSec3(e.target.value)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
