import Link from 'next/link';

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
