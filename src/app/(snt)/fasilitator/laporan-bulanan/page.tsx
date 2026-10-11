import { prisma } from "@/lib/prisma";
import LaporanBulananClient from "./client-page";

export const metadata = {
  title: "Laporan Bulanan",
};

export default async function LaporanBulananPage() {
  // Ambil semua rekap, di-group berdasarkan bulan
  const rekaps = await prisma.rekapHonorarium.findMany({
    include: {
      fasilitator: true,
      laporan: true
    },
    orderBy: {
      bulan: 'desc'
    }
  });

  // Agregasi di sisi server (atau klien). Kita oper data saja ke klien untuk difilter dan diexport.
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Laporan Rangkuman Pengeluaran Bulanan</h1>
      <LaporanBulananClient rekaps={rekaps} />
    </div>
  );
}
