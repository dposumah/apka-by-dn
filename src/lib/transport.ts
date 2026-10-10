/**
 * Utility perhitungan transport fasilitator
 */

export const HARGA_BBM_DEFAULT = 13900;

export function hitungBatasWajarTransport(
  fasilitator?: { besaranTransport?: number | null; jarakPPKm?: number | null } | null,
  hargaBBM = HARGA_BBM_DEFAULT
): number {
  const besaran = fasilitator?.besaranTransport ?? 120000;
  const jarak = fasilitator?.jarakPPKm ?? 0;
  const rumusJarak = Math.round((jarak / 10) * hargaBBM);
  return Math.max(besaran, rumusJarak);
}

export function hitungTransportSesi(
  lap: {
    metodePelaksanaan?: string | null;
    biayaTransport?: number | null;
    biayaTransportLaut?: number | null;
  },
  fasilitator?: { besaranTransport?: number | null; jarakPPKm?: number | null } | null,
  hargaBBM = HARGA_BBM_DEFAULT
): number {
  if (lap.metodePelaksanaan === 'DARING') {
    return 0;
  }
  const notaTransport = (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0);
  if (notaTransport > 0) {
    return notaTransport;
  }
  return hitungBatasWajarTransport(fasilitator, hargaBBM);
}

export function hitungTotalTransportRekap(
  rekap?: {
    jumlahSesi?: number | null;
    fasilitator?: { besaranTransport?: number | null; jarakPPKm?: number | null } | null;
    laporan?: Array<{
      metodePelaksanaan?: string | null;
      biayaTransport?: number | null;
      biayaTransportLaut?: number | null;
    }> | null;
  } | null,
  hargaBBM = HARGA_BBM_DEFAULT
): number {
  if (!rekap) return 0;
  const fasil = rekap.fasilitator;
  const standarSesi = hitungBatasWajarTransport(fasil, hargaBBM);

  const laporanList = rekap.laporan || [];
  let totalDariLaporan = 0;

  for (const lap of laporanList) {
    totalDariLaporan += hitungTransportSesi(lap, fasil, hargaBBM);
  }

  const targetSesi = rekap.jumlahSesi || (laporanList.length > 0 ? laporanList.length : 4);
  const sisaSesi = Math.max(0, targetSesi - laporanList.length);
  const totalSisa = sisaSesi * standarSesi;

  return totalDariLaporan + totalSisa;
}
