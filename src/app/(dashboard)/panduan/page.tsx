'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, HelpCircle, Layers, Lightbulb, CheckCircle2, AlertTriangle, FileText, Banknote, ListPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PanduanPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Panduan Aplikasi</h1>
          <p className="text-muted-foreground mt-1">
            Panduan dasar akuntansi, glosarium, dan contekan pengisian transaksi.
          </p>
        </div>
      </div>

      <Tabs defaultValue="konsep" className="w-full">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 mb-8">
          <TabsTrigger value="konsep">1. Pilar Dasar Akuntansi</TabsTrigger>
          <TabsTrigger value="modul">2. Panduan Modul Aplikasi</TabsTrigger>
          <TabsTrigger value="contekan">3. Contekan (Kasus Nyata)</TabsTrigger>
        </TabsList>

        {/* TAB 1: KONSEP DASAR */}
        <TabsContent value="konsep" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                Lima Pilar Utama (Bagan Akun / CoA)
              </CardTitle>
              <CardDescription>
                Setiap transaksi yang Anda masukkan akan mengalir ke dalam salah satu dari 5 kelompok ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <span className="text-xl">💰</span> Aset (Harta)
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Segala sesuatu yang bernilai yang dimiliki bisnis Anda.
                  </p>
                  <p className="text-sm">
                    <strong>Contoh:</strong> Kas (Uang Tunai), Saldo Bank, Piutang (uang Anda di pelanggan), Stok Barang, Peralatan.
                  </p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <span className="text-xl">💳</span> Liabilitas (Hutang)
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Kewajiban atau uang yang harus dibayar ke pihak lain.
                  </p>
                  <p className="text-sm">
                    <strong>Contoh:</strong> Hutang Bank, Hutang Usaha (ke supplier), Hutang Pajak.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <span className="text-xl">🏛️</span> Ekuitas (Modal)
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Hak pemilik atas bisnis setelah semua hutang dilunasi.
                  </p>
                  <p className="text-sm">
                    <strong>Contoh:</strong> Modal Awal, Prive (pengambilan uang pribadi), Laba Ditahan.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <span className="text-xl">📈</span> Pendapatan (Revenue)
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Uang hasil dari operasional/penjualan bisnis Anda.
                  </p>
                  <p className="text-sm">
                    <strong>Contoh:</strong> Penjualan Barang, Pendapatan Jasa, Pendapatan Bunga.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border md:col-span-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <span className="text-xl">💸</span> Beban (Expense)
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Biaya yang dikeluarkan untuk menjalankan bisnis sehari-hari.
                  </p>
                  <p className="text-sm">
                    <strong>Contoh:</strong> Harga Pokok Penjualan (Modal barang yang laku), Beban Gaji, Beban Listrik, Beban Iklan.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 mt-6">
                <Lightbulb className="h-6 w-6 text-blue-500 shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Aturan Debit & Kredit (Tambahan Wawasan)</h4>
                  <p className="text-sm text-blue-800">
                    - <strong>Aset & Beban:</strong> Bertambah di sisi <strong>Debit</strong>, berkurang di sisi Kredit.<br/>
                    - <strong>Hutang, Modal & Pendapatan:</strong> Bertambah di sisi <strong>Kredit</strong>, berkurang di sisi Debit.<br/>
                    <em>(Anda tidak perlu menghafal ini, karena fitur seperti Invoice/Bill sudah otomatis mengatur Debit & Kreditnya untuk Anda).</em>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PANDUAN MODUL */}
        <TabsContent value="modul" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Penjelasan Tiap Modul
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-slate-100 p-3 rounded-full h-fit">
                    <ListPlus className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Jurnal Umum</h3>
                    <p className="text-sm text-slate-600 mb-2">Buku harian yang mencatat secara kronologis setiap aktivitas keuangan.</p>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded border">
                      <strong>Kapan dipakai?</strong> Saat ada transaksi yang tidak ada menu khususnya (seperti bayar listrik, modal masuk, bayar pajak, dll). Ingat, nilai Debit dan Kredit harus selalu <strong>seimbang (Balance)</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-slate-100 p-3 rounded-full h-fit">
                    <BookOpen className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Buku Besar (General Ledger)</h3>
                    <p className="text-sm text-slate-600 mb-2">Rangkuman semua transaksi jurnal yang dikelompokkan per satu Akun.</p>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded border">
                      <strong>Kapan dipakai?</strong> Saat Anda ingin melihat riwayat detail satu akun tertentu. Misalnya: "Ke mana saja perginya uang Kas selama bulan ini?".
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-slate-100 p-3 rounded-full h-fit">
                    <Banknote className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Piutang & Hutang Usaha</h3>
                    <p className="text-sm text-slate-600 mb-2">Modul untuk menagih klien (Piutang) dan mencatat tagihan dari supplier (Hutang).</p>
                    <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded border space-y-2">
                      <p><strong>Alur Piutang:</strong> Anda buat <strong>Invoice Baru</strong> saat menyerahkan barang/jasa. Saat dibayar, catat di menu <strong>Pembayaran</strong>.</p>
                      <p><strong>Alur Hutang:</strong> Terima tagihan supplier, catat di <strong>Tagihan Baru</strong>. Saat mentransfer uang ke mereka, catat di menu <strong>Pembayaran</strong>.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-slate-100 p-3 rounded-full h-fit">
                    <HelpCircle className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Rekonsiliasi Bank</h3>
                    <p className="text-sm text-slate-600 mb-2">Mencocokkan catatan bank asli dengan catatan aplikasi.</p>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded border">
                      <strong>Kapan dipakai?</strong> Tiap akhir bulan. Bertujuan memastikan tidak ada biaya admin bank, pajak, atau bunga yang lupa tercatat di aplikasi.
                    </p>
                  </div>
                </div>

              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: CONTEKAN KASUS NYATA */}
        <TabsContent value="contekan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                Contekan Transaksi Nyata (Cheat Sheet)
              </CardTitle>
              <CardDescription>
                Bagaimana cara menginput transaksi yang sering terjadi?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 font-medium">
                    Kasus 1: Anda Menyetor Modal Awal Bisnis Rp 50.000.000
                  </div>
                  <div className="p-4 bg-white text-sm">
                    <p><strong>Lokasi Input:</strong> Jurnal Umum &rarr; Jurnal Baru</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><strong>Baris 1:</strong> Pilih Akun <code>Kas / Bank</code>, Isi Debit = 50.000.000</li>
                      <li><strong>Baris 2:</strong> Pilih Akun <code>Modal Pemilik</code>, Isi Kredit = 50.000.000</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 font-medium">
                    Kasus 2: Menjual Jasa/Barang (Belum Lunas dibayar Klien)
                  </div>
                  <div className="p-4 bg-white text-sm">
                    <p><strong>Lokasi Input:</strong> Piutang &rarr; Invoice &rarr; Baru</p>
                    <p className="mt-2 text-slate-600">
                      Anda cukup membuat Invoice. Aplikasi otomatis mencatat bertambahnya "Piutang Usaha" dan bertambahnya "Pendapatan".
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 font-medium">
                    Kasus 3: Klien Melunasi Invoice
                  </div>
                  <div className="p-4 bg-white text-sm">
                    <p><strong>Lokasi Input:</strong> Piutang &rarr; Pembayaran</p>
                    <p className="mt-2 text-slate-600">
                      Pilih nama klien, centang invoice yang dibayar, dan pilih masuk ke akun Bank mana. Aplikasi otomatis memindahkan nilai Piutang menjadi nilai Kas/Bank.
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 font-medium">
                    Kasus 4: Beli Barang Dagangan dari Supplier (Tempo/Hutang)
                  </div>
                  <div className="p-4 bg-white text-sm">
                    <p><strong>Lokasi Input:</strong> Hutang &rarr; Tagihan &rarr; Baru</p>
                    <p className="mt-2 text-slate-600">
                      Pilih barang yang Anda beli, maka otomatis stok akan bertambah, nilai "Hutang Usaha" Anda juga akan bertambah.
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 font-medium">
                    Kasus 5: Membayar Biaya Listrik, Gaji, atau Iklan
                  </div>
                  <div className="p-4 bg-white text-sm">
                    <p><strong>Lokasi Input:</strong> Jurnal Umum &rarr; Jurnal Baru</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><strong>Baris 1:</strong> Pilih Akun Beban (misal: <code>Beban Listrik</code>), Isi Debit = 500.000</li>
                      <li><strong>Baris 2:</strong> Pilih Akun <code>Kas / Bank</code>, Isi Kredit = 500.000 (uang keluar)</li>
                    </ul>
                  </div>
                </div>

              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex gap-3 mt-8">
                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Kesalahan Paling Sering (Penting!)</h4>
                  <p className="text-sm text-amber-800">
                    Terkadang pengguna mencatat penjualan <strong>dua kali</strong>. Misalnya: Sudah membuat "Invoice", lalu saat klien transfer uang, dicatat lagi di "Jurnal Umum" sebagai Pendapatan. <br/><br/>
                    <strong>Solusi:</strong> Jika Anda sudah membuat Invoice, uang masuknya <strong>hanya boleh dicatat via menu "Pembayaran" (di modul Piutang)</strong>. Jangan membuat jurnal baru lagi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
