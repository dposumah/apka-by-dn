const fs = require('fs');

const rekapPath = 'src/app/actions/rekap.ts';
let content = fs.readFileSync(rekapPath, 'utf8');

const newAction = `
export async function getRekapTargetJp(bulanTahun?: string) {
  // bulanTahun: 'YYYY-MM', default to current month
  let targetYear: number, targetMonth: number;
  if (bulanTahun) {
    const [y, m] = bulanTahun.split('-');
    targetYear = parseInt(y);
    targetMonth = parseInt(m);
  } else {
    const d = new Date();
    targetYear = d.getFullYear();
    targetMonth = d.getMonth() + 1;
  }

  const startDateBulan = new Date(targetYear, targetMonth - 1, 1);
  const endDateBulan = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  // For 4 months logic (Sept - Dec 2026) -> we can just sum ALL Laporan for the "Realisasi Total"
  // Assuming the project started in Sept 2026.

  const fasilitators = await prisma.fasilitator.findMany({
    where: { isActive: true },
    orderBy: { namaLengkap: 'asc' }
  });

  // Fetch all laporan grouped by fasilitator
  const allLaporan = await prisma.laporanKegiatan.findMany({
    select: {
      fasilitatorId: true,
      date: true,
      jumlahJPIntra: true,
      jumlahJPEkstra: true
    }
  });

  const rekapData = fasilitators.map(f => {
    const targetBulan = (f.defaultJPIntra + f.defaultJPEkstra) * 4;
    const targetTotal = targetBulan * 4; // 4 months total

    let realisasiBulan = 0;
    let realisasiTotal = 0;

    for (const lap of allLaporan) {
      if (lap.fasilitatorId === f.id) {
        const jp = (lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0);
        realisasiTotal += jp;

        const d = new Date(lap.date);
        if (d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth) {
          realisasiBulan += jp;
        }
      }
    }

    return {
      fasilitator: f,
      targetBulan,
      realisasiBulan,
      sisaBulan: Math.max(0, targetBulan - realisasiBulan),
      targetTotal,
      realisasiTotal,
      sisaTotal: Math.max(0, targetTotal - realisasiTotal),
      persenBulan: targetBulan > 0 ? Math.round((realisasiBulan / targetBulan) * 100) : 0,
      persenTotal: targetTotal > 0 ? Math.round((realisasiTotal / targetTotal) * 100) : 0
    };
  });

  return rekapData;
}
`;

if (!content.includes('getRekapTargetJp')) {
  content += newAction;
  fs.writeFileSync(rekapPath, content);
  console.log('Added getRekapTargetJp');
}
