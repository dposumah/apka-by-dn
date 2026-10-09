const fs = require('fs');

const rekapPath = 'src/app/actions/rekap.ts';
let content = fs.readFileSync(rekapPath, 'utf8');

const newAction = `
export async function getFasilitatorJpForMonth(fasilitatorId: string, bulan: string) {
  if (!fasilitatorId || !bulan) return { totalJPIntra: 0, totalJPEkstra: 0, sesi: 0 };
  const [year, month] = bulan.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

  const laporan = await prisma.laporanKegiatan.findMany({
    where: {
      fasilitatorId,
      date: { gte: startDate, lte: endDate }
    }
  });

  const totalJPIntra = laporan.reduce((sum, lap) => sum + (lap.jumlahJPIntra || 0), 0);
  const totalJPEkstra = laporan.reduce((sum, lap) => sum + (lap.jumlahJPEkstra || 0), 0);
  const sesi = laporan.length;

  return { totalJPIntra, totalJPEkstra, sesi };
}
`;

if (!content.includes('getFasilitatorJpForMonth')) {
  content += newAction;
  fs.writeFileSync(rekapPath, content);
  console.log('Added getFasilitatorJpForMonth');
} else {
  console.log('Already exists');
}
