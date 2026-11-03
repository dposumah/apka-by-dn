export const DEFAULT_IYRC_PARTICIPANTS = [
  {
    nama: "Nahjul Tazkiyyah",
    peran: "SISWA",
    sntAsal: "SNT 5 Tidore Kepulauan",
    sekolahAsal: "SMP Negeri 1 Tidore",
    biayaKompetisi: 30000000,
    biayaPerjalananVisa: 16552560,
    totalBiaya: 46552560,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Siswa Peserta Paket A (Kompetisi Saja)",
  },
  {
    nama: "Prince Jaden Alexandre Hia",
    peran: "SISWA",
    sntAsal: "SNT 10 Kupang",
    sekolahAsal: "SMP Kristen Kupang",
    biayaKompetisi: 30000000,
    biayaPerjalananVisa: 16552560,
    totalBiaya: 46552560,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Siswa Peserta Paket A (Kompetisi Saja)",
  },
  {
    nama: "Bunga Rachelia Marcely",
    peran: "SISWA",
    sntAsal: "SNT 17 Tanjung Jabung Timur",
    sekolahAsal: "SMP Negeri 17 Tanjung Jabung Timur",
    biayaKompetisi: 30000000,
    biayaPerjalananVisa: 16552560,
    totalBiaya: 46552560,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Siswa Peserta Paket A (Kompetisi Saja)",
  },
  {
    nama: "Dr. Almindo H. Ginting, S.T., M.Eng",
    peran: "GURU_PENDAMPING",
    sntAsal: "SNT 10 Kupang",
    sekolahAsal: "Fasilitator SNT Kupang",
    biayaKompetisi: 12000000,
    biayaPerjalananVisa: 16552560,
    totalBiaya: 28552560,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Guru Pendamping (Registrasi, Hotel & Makan)",
  },
  {
    nama: "Chindra Saputra, S.Kom., M.S.I.",
    peran: "GURU_PENDAMPING",
    sntAsal: "SNT 17 Tanjung Jabung Timur",
    sekolahAsal: "Fasilitator SNT Tanjabtim",
    biayaKompetisi: 12000000,
    biayaPerjalananVisa: 16552560,
    totalBiaya: 28552560,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Guru Pendamping (Registrasi, Hotel & Makan)",
  },
];

export const DEFAULT_IYRC_BUDGET_ITEMS = [
  // A. PAKET KOMPETISI SISWA (PAKET A)
  {
    code: "A.1",
    kategori: "A",
    namaKategori: "PAKET KOMPETISI SISWA (PAKET A)",
    uraian: "Robot Kit CodeSpark 3 Creator",
    volume: 3,
    satuan: "siswa",
    hargaSatuan: 7600000,
    tanggunganRobotic: 22800000,
    tanggunganPeserta: 0,
    keterangan: "Menjadi milik siswa",
    urutan: 1,
  },
  {
    code: "A.2",
    kategori: "A",
    namaKategori: "PAKET KOMPETISI SISWA (PAKET A)",
    uraian: "Competition Creative Kit",
    volume: 3,
    satuan: "siswa",
    hargaSatuan: 3000000,
    tanggunganRobotic: 9000000,
    tanggunganPeserta: 0,
    keterangan: "Termasuk 1 robot tambahan MRTDuino",
    urutan: 2,
  },
  {
    code: "A.3",
    kategori: "A",
    namaKategori: "PAKET KOMPETISI SISWA (PAKET A)",
    uraian: "Pelatihan intensif kompetisi & pendampingan",
    volume: 3,
    satuan: "siswa",
    hargaSatuan: 7400000,
    tanggunganRobotic: 22200000,
    tanggunganPeserta: 0,
    keterangan: "Pelatihan Okt–Des + pendampingan hingga hari-H",
    urutan: 3,
  },
  {
    code: "A.4",
    kategori: "A",
    namaKategori: "PAKET KOMPETISI SISWA (PAKET A)",
    uraian: "Registrasi, hotel & makan Shenzhen (11–14 Des)",
    volume: 3,
    satuan: "siswa",
    hargaSatuan: 12000000,
    tanggunganRobotic: 36000000,
    tanggunganPeserta: 0,
    keterangan: "Paket 4 hari 3 malam",
    urutan: 4,
  },

  // B. PAKET GURU PENDAMPING
  {
    code: "B.1",
    kategori: "B",
    namaKategori: "PAKET GURU PENDAMPING",
    uraian: "Registrasi, hotel & makan Shenzhen (11–14 Des)",
    volume: 2,
    satuan: "orang",
    hargaSatuan: 12000000,
    tanggunganRobotic: 24000000,
    tanggunganPeserta: 0,
    keterangan: "Tanpa kit & pelatihan",
    urutan: 5,
  },

  // C. DOKUMEN & PERLINDUNGAN PERJALANAN
  {
    code: "C.1",
    kategori: "C",
    namaKategori: "DOKUMEN & PERLINDUNGAN PERJALANAN (DI LUAR TANGGUNGAN)",
    uraian: "Visa China",
    volume: 5,
    satuan: "orang",
    hargaSatuan: 1600000,
    tanggunganRobotic: 0,
    tanggunganPeserta: 8000000,
    keterangan: "Agen Rp1.600.000 / standar online Rp974.000",
    urutan: 6,
  },
  {
    code: "C.2",
    kategori: "C",
    namaKategori: "DOKUMEN & PERLINDUNGAN PERJALANAN (DI LUAR TANGGUNGAN)",
    uraian: "Paspor",
    volume: 1,
    satuan: "orang",
    hargaSatuan: 350000,
    tanggunganRobotic: 0,
    tanggunganPeserta: 350000,
    keterangan: "Untuk pendamping/peserta yang belum memiliki paspor",
    urutan: 7,
  },
  {
    code: "C.3",
    kategori: "C",
    namaKategori: "DOKUMEN & PERLINDUNGAN PERJALANAN (DI LUAR TANGGUNGAN)",
    uraian: "Asuransi perjalanan internasional",
    volume: 5,
    satuan: "orang",
    hargaSatuan: 400000,
    tanggunganRobotic: 0,
    tanggunganPeserta: 2000000,
    keterangan: "Estimasi, ±7 hari Asia",
    urutan: 8,
  },

  // D. PERJALANAN DOMESTIK
  {
    code: "D.1",
    kategori: "D",
    namaKategori: "PERJALANAN DOMESTIK SNT ↔ JAKARTA (DI LUAR TANGGUNGAN)",
    uraian: "Transport lokal daerah asal ↔ bandara",
    volume: 5,
    satuan: "orang",
    hargaSatuan: 300000,
    tanggunganRobotic: 0,
    tanggunganPeserta: 1500000,
    keterangan: "Sesuai SNT asal",
    urutan: 9,
  },
  {
    code: "D.2",
    kategori: "D",
    namaKategori: "PERJALANAN DOMESTIK SNT ↔ JAKARTA (DI LUAR TANGGUNGAN)",
    uraian: "Tiket pesawat domestik ↔ Jakarta PP",
    volume: 5,
    satuan: "orang",
    hargaSatuan: 4500000,
    tanggunganRobotic: 0,
    tanggunganPeserta: 22500000,
    keterangan: "Tiba di CGK 10 Des; pulang 15/16 Des langsung ke daerah asal, tanpa menginap di Jakarta",
    urutan: 10,
  },

  // E. PERJALANAN INTERNASIONAL
  {
    code: "E.1",
    kategori: "E",
    namaKategori: "PERJALANAN INTERNASIONAL JAKARTA ↔ SHENZHEN (DI LUAR TANGGUNGAN)",
    uraian: "Tiket pesawat CGK ↔ SZX PP",
    volume: 5,
    satuan: "orang",
    hargaSatuan: 8032560,
    tanggunganRobotic: 0,
    tanggunganPeserta: 40162800,
    keterangan: "Estimasi (harga acuan 10 Okt 2026). Berangkat CZ8056 11 Des 09.05, tiba 15.25; pulang 15 Des",
    urutan: 11,
  },
  {
    code: "E.2",
    kategori: "E",
    namaKategori: "PERJALANAN INTERNASIONAL JAKARTA ↔ SHENZHEN (DI LUAR TANGGUNGAN)",
    uraian: "Hotel Shenzhen di luar paket: 14 Des",
    volume: 3,
    satuan: "kamar-malam",
    hargaSatuan: 1000000,
    tanggunganRobotic: 0,
    tanggunganPeserta: 3000000,
    keterangan: "Estimasi 3 kamar × 1 malam; paket mencakup 11–14 Des",
    urutan: 12,
  },
  {
    code: "E.3",
    kategori: "E",
    namaKategori: "PERJALANAN INTERNASIONAL JAKARTA ↔ SHENZHEN (DI LUAR TANGGUNGAN)",
    uraian: "Transport Shenzhen: bandara SZX ↔ hotel",
    volume: 2,
    satuan: "trip",
    hargaSatuan: 500000,
    tanggunganRobotic: 0,
    tanggunganPeserta: 1000000,
    keterangan: "Estimasi van 5 orang + barang",
    urutan: 13,
  },
  {
    code: "E.4",
    kategori: "E",
    namaKategori: "PERJALANAN INTERNASIONAL JAKARTA ↔ SHENZHEN (DI LUAR TANGGUNGAN)",
    uraian: "Konsumsi di luar paket (14 malam & 15 Des)",
    volume: 10,
    satuan: "orang-hari",
    hargaSatuan: 350000,
    tanggunganRobotic: 0,
    tanggunganPeserta: 3500000,
    keterangan: "Estimasi ±CNY 150/orang/hari",
    urutan: 14,
  },
  {
    code: "E.5",
    kategori: "E",
    namaKategori: "PERJALANAN INTERNASIONAL JAKARTA ↔ SHENZHEN (DI LUAR TANGGUNGAN)",
    uraian: "Kartu data / eSIM China",
    volume: 5,
    satuan: "orang",
    hargaSatuan: 150000,
    tanggunganRobotic: 0,
    tanggunganPeserta: 750000,
    keterangan: "Estimasi; perlu untuk komunikasi & aplikasi lokal",
    urutan: 15,
  },
];

/**
 * Kalkulasi ulang RAB secara dinamis berdasarkan jumlah siswa dan pendamping
 */
export function calculateDynamicRab(countSiswa: number, countPendamping: number, currentItems?: any[]) {
  const totalPersonel = countSiswa + countPendamping;
  const items = currentItems && currentItems.length > 0 ? JSON.parse(JSON.stringify(currentItems)) : JSON.parse(JSON.stringify(DEFAULT_IYRC_BUDGET_ITEMS));

  let totalTanggunganRobotic = 0;
  let totalTanggunganPeserta = 0;

  items.forEach((item: any) => {
    switch (item.code) {
      // Pos A: Paket Siswa
      case "A.1":
      case "A.2":
      case "A.3":
      case "A.4":
        item.volume = countSiswa;
        item.tanggunganRobotic = countSiswa * item.hargaSatuan;
        item.tanggunganPeserta = 0;
        break;

      // Pos B: Guru Pendamping
      case "B.1":
        item.volume = countPendamping;
        item.tanggunganRobotic = countPendamping * item.hargaSatuan;
        item.tanggunganPeserta = 0;
        break;

      // Pos C: Dokumen & Visa
      case "C.1": // Visa
        item.volume = totalPersonel;
        item.tanggunganPeserta = totalPersonel * item.hargaSatuan;
        break;
      case "C.2": // Paspor (default 1 jika ada pendamping, atau proporsional)
        item.volume = countPendamping > 0 ? Math.max(1, Math.round(countPendamping / 2)) : 0;
        item.tanggunganPeserta = item.volume * item.hargaSatuan;
        break;
      case "C.3": // Asuransi
        item.volume = totalPersonel;
        item.tanggunganPeserta = totalPersonel * item.hargaSatuan;
        break;

      // Pos D: Domestik
      case "D.1": // Transport lokal
      case "D.2": // Tiket pesawat domestik PP
        item.volume = totalPersonel;
        item.tanggunganPeserta = totalPersonel * item.hargaSatuan;
        break;

      // Pos E: Internasional
      case "E.1": // Tiket CZ8056/CZ8353
        item.volume = totalPersonel;
        item.tanggunganPeserta = totalPersonel * item.hargaSatuan;
        break;
      case "E.2": // Hotel Shenzhen 14 Des
        item.volume = Math.max(1, Math.ceil(totalPersonel / 2));
        item.tanggunganPeserta = item.volume * item.hargaSatuan;
        break;
      case "E.3": // Transport Van bandara-hotel
        item.volume = totalPersonel > 7 ? Math.ceil(totalPersonel / 6) * 2 : 2;
        item.tanggunganPeserta = item.volume * item.hargaSatuan;
        break;
      case "E.4": // Konsumsi luar paket (2 hari)
        item.volume = totalPersonel * 2;
        item.tanggunganPeserta = item.volume * item.hargaSatuan;
        break;
      case "E.5": // eSIM China
        item.volume = totalPersonel;
        item.tanggunganPeserta = totalPersonel * item.hargaSatuan;
        break;

      default:
        break;
    }

    totalTanggunganRobotic += item.tanggunganRobotic || 0;
    totalTanggunganPeserta += item.tanggunganPeserta || 0;
  });

  const perPersonTravelFee = totalPersonel > 0 ? Math.round(totalTanggunganPeserta / totalPersonel) : 0;
  const biayaPerSiswa = 30000000 + perPersonTravelFee;
  const biayaPerPendamping = 12000000 + perPersonTravelFee;

  return {
    items,
    countSiswa,
    countPendamping,
    totalPersonel,
    totalTanggunganRobotic,
    totalTanggunganPeserta,
    totalKeseluruhan: totalTanggunganRobotic + totalTanggunganPeserta,
    perPersonTravelFee,
    biayaPerSiswa,
    biayaPerPendamping,
  };
}
