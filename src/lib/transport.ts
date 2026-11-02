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
    totalTransport?: number | null;
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
  // Jika admin telah mengatur/mengedit total transport secara manual, gunakan nilai tersebut
  if (rekap.totalTransport !== null && rekap.totalTransport !== undefined) {
    return Number(rekap.totalTransport) || 0;
  }

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

export interface DetailTransportSesi {
  no: number;
  tanggal?: string;
  metode: 'LURING' | 'DARING';
  jenisPenggantian: 'BUKTI_TIKET' | 'RUMUS_BBM' | 'STANDAR_LOKAL' | 'DARING';
  jarakPPKm: number;
  biayaDarat: number;
  biayaLaut: number;
  total: number;
  keterangan: string;
  hasBukti: boolean;
}

export interface DetailTransportRekap {
  totalTransport: number;
  targetSesi: number;
  sesiLuringCount: number;
  sesiDaringCount: number;
  isCustomAdmin: boolean;
  ringkasanKeterangan: string;
  items: DetailTransportSesi[];
}

export function hitungDetailTransportRekap(
  rekap?: any,
  hargaBBM = HARGA_BBM_DEFAULT
): DetailTransportRekap {
  if (!rekap) {
    return {
      totalTransport: 0,
      targetSesi: 0,
      sesiLuringCount: 0,
      sesiDaringCount: 0,
      isCustomAdmin: false,
      ringkasanKeterangan: 'Tidak ada data transport',
      items: []
    };
  }

  const fasil = rekap.fasilitator || {};
  const jarak = Number(fasil.jarakPPKm) || 0;
  const besaran = Number(fasil.besaranTransport) || 120000;
  const rumusJarak = Math.round((jarak / 10) * hargaBBM);
  const standarSesi = Math.max(besaran, rumusJarak);

  const laporanList: any[] = rekap.laporan || [];
  const targetSesi = rekap.jumlahSesi || (laporanList.length > 0 ? laporanList.length : 4);

  const isCustomAdmin = rekap.totalTransport !== null && rekap.totalTransport !== undefined;
  
  const items: DetailTransportSesi[] = [];
  let sesiLuringCount = 0;
  let sesiDaringCount = 0;

  // 1. Proses dari laporan kegiatan yang ada
  laporanList.forEach((lap, idx) => {
    const isDaring = lap.metodePelaksanaan === 'DARING';
    if (isDaring) {
      sesiDaringCount++;
    } else {
      sesiLuringCount++;
    }

    const tgl = lap.date ? new Date(lap.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : undefined;
    const biayaDarat = Number(lap.biayaTransport) || 0;
    const biayaLaut = Number(lap.biayaTransportLaut) || 0;
    const notaTransport = biayaDarat + biayaLaut;
    const hasBukti = Boolean(lap.buktiTiketTransport || lap.buktiTransportDarat);

    if (isDaring) {
      items.push({
        no: idx + 1,
        tanggal: tgl,
        metode: 'DARING',
        jenisPenggantian: 'DARING',
        jarakPPKm: 0,
        biayaDarat: 0,
        biayaLaut: 0,
        total: 0,
        keterangan: 'Pelaksanaan Daring (Online)',
        hasBukti: false
      });
    } else if (notaTransport > 0) {
      let ket = '';
      if (biayaLaut > 0 && biayaDarat > 0) {
        ket = `Tiket Laut Rp ${biayaLaut.toLocaleString('id-ID')} + Darat Rp ${biayaDarat.toLocaleString('id-ID')}`;
      } else if (biayaLaut > 0) {
        ket = `Tiket Laut (Rp ${biayaLaut.toLocaleString('id-ID')})`;
      } else {
        ket = `Transport Darat (Rp ${biayaDarat.toLocaleString('id-ID')})`;
      }

      items.push({
        no: idx + 1,
        tanggal: tgl,
        metode: 'LURING',
        jenisPenggantian: 'BUKTI_TIKET',
        jarakPPKm: jarak,
        biayaDarat,
        biayaLaut,
        total: notaTransport,
        keterangan: ket,
        hasBukti
      });
    } else {
      let ket = '';
      let jenis: 'RUMUS_BBM' | 'STANDAR_LOKAL' = 'STANDAR_LOKAL';
      if (rumusJarak > besaran) {
        jenis = 'RUMUS_BBM';
        ket = `Rumus BBM Jarak PP ${jarak} km`;
      } else if (jarak > 0) {
        ket = `Bantuan BBM & Operasional (Jarak PP ${jarak} km)`;
      } else {
        ket = `Bantuan Transport Lokal SNT`;
      }

      items.push({
        no: idx + 1,
        tanggal: tgl,
        metode: 'LURING',
        jenisPenggantian: jenis,
        jarakPPKm: jarak,
        biayaDarat: standarSesi,
        biayaLaut: 0,
        total: standarSesi,
        keterangan: ket,
        hasBukti: false
      });
    }
  });

  // 2. Tambahkan sisa sesi jika jumlah laporan kurang dari target sesi
  const sisaSesi = Math.max(0, targetSesi - laporanList.length);
  for (let i = 0; i < sisaSesi; i++) {
    sesiLuringCount++;
    const no = laporanList.length + i + 1;
    let ket = '';
    let jenis: 'RUMUS_BBM' | 'STANDAR_LOKAL' = 'STANDAR_LOKAL';
    if (rumusJarak > besaran) {
      jenis = 'RUMUS_BBM';
      ket = `Rumus BBM Jarak PP ${jarak} km`;
    } else if (jarak > 0) {
      ket = `Bantuan BBM & Operasional (Jarak PP ${jarak} km)`;
    } else {
      ket = `Bantuan Transport Lokal SNT`;
    }

    items.push({
      no,
      tanggal: undefined,
      metode: 'LURING',
      jenisPenggantian: jenis,
      jarakPPKm: jarak,
      biayaDarat: standarSesi,
      biayaLaut: 0,
      total: standarSesi,
      keterangan: ket,
      hasBukti: false
    });
  }

  // Hitung total keseluruhan
  let totalTransport = 0;
  if (isCustomAdmin) {
    totalTransport = Number(rekap.totalTransport) || 0;
  } else {
    totalTransport = items.reduce((sum, it) => sum + it.total, 0);
  }

  // Ringkasan Keterangan
  let ringkasanKeterangan = '';
  if (isCustomAdmin) {
    const perSesi = targetSesi > 0 ? Math.round(totalTransport / targetSesi) : totalTransport;
    const jarakKet = jarak > 0 ? ` - Jarak PP ${jarak} km` : '';
    ringkasanKeterangan = `${targetSesi} Pertemuan @ Rp ${perSesi.toLocaleString('id-ID')} (Bantuan BBM & Transport${jarakKet})`;
  } else {
    const hasLaut = items.some(it => it.biayaLaut > 0);
    if (hasLaut) {
      const totLaut = items.reduce((s, it) => s + it.biayaLaut, 0);
      const totDarat = items.reduce((s, it) => s + it.biayaDarat, 0);
      ringkasanKeterangan = `${targetSesi} Sesi (Tiket Laut Rp ${totLaut.toLocaleString('id-ID')} + Bantuan BBM/Darat Rp ${totDarat.toLocaleString('id-ID')})`;
    } else if (sesiDaringCount > 0) {
      ringkasanKeterangan = `${sesiLuringCount} Sesi Luring @ Rp ${standarSesi.toLocaleString('id-ID')} + ${sesiDaringCount} Sesi Daring (Rp 0)`;
    } else {
      const infoJarak = jarak > 0 ? ` - Jarak PP ${jarak} km` : '';
      ringkasanKeterangan = `${sesiLuringCount} Pertemuan Luring @ Rp ${standarSesi.toLocaleString('id-ID')} (Bantuan BBM${infoJarak})`;
    }
  }

  return {
    totalTransport,
    targetSesi,
    sesiLuringCount,
    sesiDaringCount,
    isCustomAdmin,
    ringkasanKeterangan,
    items
  };
}
