/**
 * Data & kalkulasi RAB IYRC China 2026 – SNT Wilayah 2
 * Sumber: RAB IYRC China 2026 (4 Siswa & 2 Pendamping) versi Kamis, 5 November 2026 14.58 WIB,
 *         Informasi Perjalanan Delegasi SNT versi 5 November 2026 15.04 WIB,
 *         RAB Akomodasi Hotel Jakarta Barat (Grogol) 5 November 2026.
 *
 * Konvensi field:
 * - tanggunganRobotic  = Rincian I  – Biaya Kompetisi (ditransfer ke Robotic Explorer)
 * - tanggunganPeserta  = Rincian II – Estimasi Perjalanan & Dokumen (disiapkan langsung oleh Kemendikdasmen)
 */

export const IYRC_DATA_VERSION = "Kamis, 5 November 2026 · 14.58 WIB";

export const IYRC_INFO = {
  eventName: "The 14th IYRC International Youth Robotics and AI Competition",
  venue: "Longgang International Arts Center, Shenzhen",
  competitionDates: "12–13 Desember 2026",
  travelPeriod: "10–15 Desember 2026",
  hotelName: "Zhongbao International Hotel",
  hotelNameCn: "深圳中保国际酒店",
  hotelAddress: "No. 21 Donghuan 2nd Road, Longhua District, Shenzhen, Guangdong Province, China",
  hotelAddressCn: "广东省深圳市龙华区东环二路21号",
  flightOut: "China Southern CZ8056 · Jumat, 11 Des 2026 · CGK T3 09.05 → SZX T3 15.25 (A320neo)",
  flightBack: "China Southern CZ8353 · Senin, 14 Des 2026 · SZX T3 19.05 → CGK T3 23.20 (A321neo)",
  bankAccount: "BCA 7040827000 a.n. PT Jully Tjindrawan Robotik",
  bankTransfer: {
    bank: "BCA",
    accountNumber: "7040827000",
    accountHolder: "PT Jully Tjindrawan Robotik",
  },
  kopSurat: {
    alamat: "Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510",
    email: "info@worldroboticexplorer.com",
    telepon: "0822-9898-4848",
  },
  preparedBy: {
    nama: "Galvin Amaris Limbrawan",
    jabatan: "Program Director Robotic Explorer",
    instansi: "PT Jully Tjindrawan Robotik",
  },
  approvedBy: {
    nama: "Jully Tjindrawan, MBA",
    jabatan: "Koordinator Wilayah 2",
    instansi: "PT Jully Tjindrawan Robotik",
  },
  usdRate: 18000,
};

/** Paket per orang (untuk ringkasan & simulasi) */
export const IYRC_PACKAGE = {
  pendampingPackage: 12000000, // B.1 per guru pendamping
  categoryFeeUsd: 250,
  categoryCount: 3, // Jurassic Explorer, Sumo, Creative – masing-masing 1 tim
  studyTourPerPerson: 6500000, // F.1 / F.2
  studyTourAddOn: 6500000, // Alias
};

export const DEFAULT_IYRC_PARTICIPANTS = [
  {
    nama: "Nahjul Tazkiyyah",
    peran: "SISWA",
    sntAsal: "SNT 5 Tidore Kepulauan",
    sekolahAsal: "Siswa SMP",
    biayaKompetisi: 33375000,
    biayaPerjalananVisa: 14649227,
    totalBiaya: 48024227,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Siswa SMP – Paket A (Kompetisi Saja)",
  },
  {
    nama: "Prince Jaden Alexandre Hia",
    peran: "SISWA",
    sntAsal: "SNT 10 Kupang",
    sekolahAsal: "Siswa SMP",
    biayaKompetisi: 33375000,
    biayaPerjalananVisa: 14649227,
    totalBiaya: 48024227,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Siswa SMP – Paket A (Kompetisi Saja)",
  },
  {
    nama: "Bunga Rachelia Marcely",
    peran: "SISWA",
    sntAsal: "SNT 17 Tanjung Jabung Timur",
    sekolahAsal: "Siswa SMA",
    biayaKompetisi: 33375000,
    biayaPerjalananVisa: 14649227,
    totalBiaya: 48024227,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Siswa SMA – Paket A (Kompetisi Saja)",
  },
  {
    nama: "[Nama Siswa – SNT 15 Buton Tengah]",
    peran: "SISWA",
    sntAsal: "SNT 15 Buton Tengah",
    sekolahAsal: "Siswa SMA",
    biayaKompetisi: 33375000,
    biayaPerjalananVisa: 14649227,
    totalBiaya: 48024227,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Siswa SMA – Paket A (Kompetisi Saja). Nama menyusul, mohon diedit.",
  },
  {
    nama: "Farid A. M, S.Sos., M.M.",
    peran: "GURU_PENDAMPING",
    sntAsal: "SNT 5 Tidore Kepulauan",
    sekolahAsal: "Kepala Sekolah",
    biayaKompetisi: 12000000,
    biayaPerjalananVisa: 14649227,
    totalBiaya: 26649227,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Guru Pendamping (Kepala Sekolah) – Registrasi, Hotel & Makan. Menggantikan pendamping sebelumnya.",
  },
  {
    nama: "Chindra Saputra, S.Kom., M.S.I.",
    peran: "GURU_PENDAMPING",
    sntAsal: "SNT 17 Tanjung Jabung Timur",
    sekolahAsal: "Guru Pendamping",
    biayaKompetisi: 12000000,
    biayaPerjalananVisa: 14649227,
    totalBiaya: 26649227,
    statusPembayaran: "BELUM_LUNAS",
    nominalTerbayar: 0,
    catatan: "Guru Pendamping – Registrasi, Hotel & Makan",
  },
];

/** Nama peserta lama yang digantikan pada data 5 Nov 2026 */
export const REPLACED_IYRC_PARTICIPANTS = ["Dr. Almindo H. Ginting, S.T., M.Eng"];

const KAT_A = "PAKET KOMPETISI SISWA (PAKET A)";
const KAT_B = "PAKET GURU PENDAMPING";
const KAT_C = "DOKUMEN & PERLINDUNGAN PERJALANAN";
const KAT_D = "PERJALANAN DOMESTIK SNT ↔ JAKARTA";
const KAT_E = "PERJALANAN INTERNASIONAL JAKARTA ↔ SHENZHEN";

export const DEFAULT_IYRC_BUDGET_ITEMS = [
  // ===== RINCIAN I – BIAYA KOMPETISI (ditransfer ke Robotic Explorer) =====
  { code: "A.1", kategori: "A", namaKategori: KAT_A, uraian: "Robot Kit CodeSpark 3 Creator", volume: 4, satuan: "siswa", hargaSatuan: 7600000, tanggunganRobotic: 30400000, tanggunganPeserta: 0, keterangan: "Menjadi milik siswa", urutan: 1 },
  { code: "A.2", kategori: "A", namaKategori: KAT_A, uraian: "Competition Creative Kit", volume: 4, satuan: "siswa", hargaSatuan: 3000000, tanggunganRobotic: 12000000, tanggunganPeserta: 0, keterangan: "Termasuk 1 robot tambahan MRTDuino", urutan: 2 },
  { code: "A.3", kategori: "A", namaKategori: KAT_A, uraian: "Pelatihan intensif kompetisi & pendampingan", volume: 4, satuan: "siswa", hargaSatuan: 7400000, tanggunganRobotic: 29600000, tanggunganPeserta: 0, keterangan: "Pelatihan intensif di Jakarta 16 Nov – 9 Des (19 sesi) + pendampingan hingga hari-H", urutan: 3 },
  { code: "A.4", kategori: "A", namaKategori: KAT_A, uraian: "Registrasi, hotel & makan Shenzhen (11–14 Des)", volume: 4, satuan: "siswa", hargaSatuan: 12000000, tanggunganRobotic: 48000000, tanggunganPeserta: 0, keterangan: "Paket 4H3M di Zhongbao International Hotel. Dibayar langsung oleh Robotic Explorer ke panitia IYRC / My Robot Time (MRT)", urutan: 4 },
  { code: "A.5", kategori: "A", namaKategori: KAT_A, uraian: "Biaya pendaftaran kategori kompetisi (Jurassic Explorer, Sumo, Creative)", volume: 3, satuan: "kategori", hargaSatuan: 4500000, tanggunganRobotic: 13500000, tanggunganPeserta: 0, keterangan: "USD 250 per kategori × 3 kategori, masing-masing 1 tim; kurs estimasi Rp18.000/USD. Dibayar langsung ke panitia IYRC / MRT", urutan: 5 },

  { code: "B.1", kategori: "B", namaKategori: KAT_B, uraian: "Registrasi, hotel & makan Shenzhen (11–14 Des)", volume: 2, satuan: "orang", hargaSatuan: 12000000, tanggunganRobotic: 24000000, tanggunganPeserta: 0, keterangan: "Tanpa kit & pelatihan. Dibayar langsung oleh Robotic Explorer ke panitia IYRC / MRT", urutan: 6 },

  // ===== RINCIAN II – ESTIMASI PERJALANAN & DOKUMEN (disiapkan langsung oleh Kemendikdasmen) =====
  { code: "C.1", kategori: "C", namaKategori: KAT_C, uraian: "Visa China", volume: 6, satuan: "orang", hargaSatuan: 1500000, tanggunganRobotic: 0, tanggunganPeserta: 9000000, keterangan: "Agen Rp1.500.000 / standar online Rp974.000", urutan: 7 },
  { code: "C.2", kategori: "C", namaKategori: KAT_C, uraian: "Paspor", volume: 6, satuan: "orang", hargaSatuan: 0, tanggunganRobotic: 0, tanggunganPeserta: 0, keterangan: "Ditanggung oleh kota/daerah masing-masing", urutan: 8 },
  { code: "C.3", kategori: "C", namaKategori: KAT_C, uraian: "Asuransi perjalanan internasional", volume: 6, satuan: "orang", hargaSatuan: 0, tanggunganRobotic: 0, tanggunganPeserta: 0, keterangan: "Ditanggung oleh kota/daerah masing-masing", urutan: 9 },

  { code: "D.1", kategori: "D", namaKategori: KAT_D, uraian: "Transport lokal daerah asal ↔ bandara", volume: 6, satuan: "orang", hargaSatuan: 300000, tanggunganRobotic: 0, tanggunganPeserta: 1800000, keterangan: "Sesuai SNT asal", urutan: 10 },
  { code: "D.2", kategori: "D", namaKategori: KAT_D, uraian: "Tiket pesawat domestik ↔ Jakarta PP", volume: 6, satuan: "orang", hargaSatuan: 4500000, tanggunganRobotic: 0, tanggunganPeserta: 27000000, keterangan: "Tiba di CGK 10 Des (siswa 15 Nov); pulang subuh 15 Des langsung ke daerah asal", urutan: 11 },
  { code: "D.3", kategori: "D", namaKategori: KAT_D, uraian: "Transport Jakarta: CGK ↔ hotel", volume: 2, satuan: "trip", hargaSatuan: 450000, tanggunganRobotic: 0, tanggunganPeserta: 900000, keterangan: "Tiba 10 Des ke hotel; 11 Des pagi ke CGK", urutan: 12 },

  { code: "E.1", kategori: "E", namaKategori: KAT_E, uraian: "Tiket pesawat CGK ↔ SZX PP", volume: 6, satuan: "orang", hargaSatuan: 8032560, tanggunganRobotic: 0, tanggunganPeserta: 48195360, keterangan: "Estimasi (harga acuan 10 Okt 2026). CZ8056 11 Des 09.05 → 15.25; CZ8353 14 Des 19.05 → 23.20", urutan: 13 },
  { code: "E.2", kategori: "E", namaKategori: KAT_E, uraian: "Transport Shenzhen: bandara SZX ↔ hotel", volume: 2, satuan: "trip", hargaSatuan: 500000, tanggunganRobotic: 0, tanggunganPeserta: 1000000, keterangan: "11 Des ke hotel; 14 Des ke bandara. Estimasi van 6 orang + barang", urutan: 14 },
  { code: "E.3", kategori: "E", namaKategori: KAT_E, uraian: "Konsumsi di luar paket (10 Des di Jakarta & 14 Des malam)", volume: 12, satuan: "orang-hari", hargaSatuan: 0, tanggunganRobotic: 0, tanggunganPeserta: 0, keterangan: "Tidak dianggarkan dalam RAB ini", urutan: 15 },
  { code: "E.4", kategori: "E", namaKategori: KAT_E, uraian: "Kartu data / eSIM China", volume: 6, satuan: "orang", hargaSatuan: 0, tanggunganRobotic: 0, tanggunganPeserta: 0, keterangan: "Tidak dianggarkan dalam RAB ini", urutan: 16 },
];

/** Opsi Hotel Pelatihan Jakarta (perbandingan, belum dipilih) – tanggungan Robotic Explorer */
export const JAKARTA_TRAINING_STAY = {
  checkIn: "Minggu, 15 November 2026",
  checkOut: "Jumat, 11 Desember 2026",
  originalPeriod: "14 Nov – 10 Des 2026 (dokumen RAB hotel)",
  nights: 26,
  rooms: 2,
  location: "Kec. Grogol Petamburan, Jakarta Barat",
  note:
    "Periode digeser dari 14 Nov–10 Des menjadi 15 Nov–11 Des agar malam 10 Des (sebelum terbang 11 Des pukul 09.05) tercakup. Jumlah malam tetap 26 sehingga biaya sama.",
  // Alias keys for compatibility with various components
  lokasiPelatihan: "Kec. Grogol Petamburan, Jakarta Barat",
  jumlahKamar: 2,
  jumlahMalam: 26,
  totalKamarMalam: 52,
  catatanSinkronisasi:
    "Periode digeser dari 14 Nov–10 Des menjadi 15 Nov–11 Des agar malam 10 Des (sebelum terbang 11 Des pukul 09.05) tercakup. Jumlah malam tetap 26 sehingga biaya sama.",
};

export const JAKARTA_HOTEL_OPTIONS = [
  {
    id: "social-hub",
    key: "social-hub",
    opsi: "I",
    nama: "Social Hub by TwoSpaces",
    bintang: 3,
    jarakKeVenue: "±1,6 km (±5-7 mnt)",
    tipeKamar: "Standard Twin Room (2 Single Beds)",
    alamat: "Jl. Sosial No. 52, Kec. Grogol Petamburan, Kota Jakarta Barat, DKI Jakarta 11460",
    tarifDasar: 235700,
    tarifDasarMalam: 235700,
    servicePct: 0,
    pajakPct: 0,
    tarifInklusif: true,
    rekomendasi: true,
    sarapan: "Tidak termasuk (Rp65.000/orang/hari)",
    fasilitas: "46 kamar ber-AC, Wi-Fi gratis, resepsionis 24 jam, restoran/kafe, parkir gratis; tidak ada lift",
    sumber: "Expedia – mulai US$13/malam (±Rp235.700), sudah termasuk pajak & fee",
    catatan: "Paling hemat dan efisien. Area tenang dengan kafe & Wi-Fi memadai untuk persiapan peserta setelah pelatihan.",
  },
  {
    id: "maple",
    key: "maple",
    opsi: "II",
    nama: "Maple Hotel Grogol",
    bintang: 3,
    jarakKeVenue: "±2,1 km (±7-10 mnt)",
    tipeKamar: "Superior Twin Room (2 Single Beds)",
    alamat: "Jl. Kali Sekretaris Dalam No. 55, RT.5/RW.1, Tj. Duren Utara, Kec. Grogol Petamburan, Jakarta Barat 11470 · Telp. +62 21 2256 1234",
    tarifDasar: 247604,
    tarifDasarMalam: 247604,
    servicePct: 10,
    pajakPct: 10,
    tarifInklusif: false,
    rekomendasi: false,
    sarapan: "Tidak termasuk (opsional, biaya tambahan)",
    fasilitas: "Restoran, bar, Wi-Fi gratis di kamar, brankas kamar, ruang konferensi, parkir gratis; ±6 menit jalan kaki ke Mal Ciputra",
    sumber: "Trivago – mulai Rp247.604/malam, belum termasuk pajak & service",
    catatan: "Alternatif hotel representatif di Tanjung Duren, kemudahan invoice korporat resmi untuk pertanggungjawaban SPJ.",
  },
  {
    id: "mercure",
    key: "mercure",
    opsi: "III",
    nama: "Mercure Jakarta Grogol",
    bintang: 4,
    jarakKeVenue: "±2,8 km (±10-15 mnt)",
    tipeKamar: "Superior Twin Room (2 Single Beds)",
    alamat: "Jl. Daan Mogot No. 50 B, Wijaya Kusuma, Kec. Grogol Petamburan, Kota Jakarta Barat 11460",
    tarifDasar: 523000,
    tarifDasarMalam: 523000,
    servicePct: 10,
    pajakPct: 10,
    tarifInklusif: false,
    rekomendasi: false,
    sarapan: "Tidak termasuk (restoran tersedia, berbayar)",
    fasilitas: "95 kamar & suite; kolam renang outdoor, spa, gym, restoran, 7 ruang rapat, parkir & Wi-Fi gratis",
    sumber: "Trip.com – mulai S$39/malam (±Rp523.000), belum termasuk pajak & service",
    catatan: "Opsi fasilitas terlengkap standar bintang 4 internasional (Accor), cocok bila membutuhkan ruang pertemuan internal.",
  },
];

/** Hitung rincian biaya hotel pelatihan Jakarta (service 10% × sewa; PBJT 10% × (sewa + service)) */
export function calculateJakartaHotel(
  option: (typeof JAKARTA_HOTEL_OPTIONS)[number] | any,
  nights = 26,
  rooms = 2,
  siswaCount = 4
) {
  const roomNights = nights * rooms;
  const tarifDasarMalam = option?.tarifDasarMalam || option?.tarifDasar || 0;
  const sewaKamar = roomNights * tarifDasarMalam;
  const serviceCharge = option?.tarifInklusif ? 0 : Math.round(sewaKamar * ((option?.servicePct || 0) / 100));
  const pajakPbjt = option?.tarifInklusif ? 0 : Math.round((sewaKamar + serviceCharge) * ((option?.pajakPct || 0) / 100));
  const totalBiaya = sewaKamar + serviceCharge + pajakPbjt;
  const tarifEfektifKamarMalam = roomNights > 0 ? Math.round(totalBiaya / roomNights) : 0;
  const perSiswa = siswaCount > 0 ? Math.round(totalBiaya / siswaCount) : 0;
  const perSiswaPerMalam = (siswaCount > 0 && nights > 0) ? Math.round(totalBiaya / (siswaCount * nights)) : 0;

  return {
    roomNights,
    kamarMalam: roomNights,
    sewa: sewaKamar,
    sewaKamar,
    service: serviceCharge,
    serviceCharge,
    pajak: pajakPbjt,
    pajakPbjt,
    total: totalBiaya,
    totalBiaya,
    perKamarMalam: tarifEfektifKamarMalam,
    tarifEfektifKamarMalam,
    perSiswa,
    perSiswaPerMalam,
    perMalamSemuaKamar: tarifEfektifKamarMalam * rooms,
  };
}

/** Ringkasan pelatihan siswa di Jakarta (4 Pekan · 19 Sesi) */
export const TRAINING_WEEKS = [
  {
    minggu: "Pekan 1",
    pekan: "Pekan 1",
    periode: "16 – 22 Nov 2026",
    tanggal: "16 – 22 Nov 2026",
    jumlahSesi: "7 Sesi",
    fokusMateri: "Pengenalan CodeSpark 3, perakitan robot line tracing & remote control, latihan misi Jurassic Survival, integrasi awal dua robot (Sesi 1–7)",
    fokus: "Pengenalan CodeSpark 3, perakitan robot line tracing & remote control, latihan misi Jurassic Survival, integrasi awal dua robot (Sesi 1–7)",
  },
  {
    minggu: "Pekan 2",
    pekan: "Pekan 2",
    periode: "23 – 29 Nov 2026",
    tanggal: "23 – 29 Nov 2026",
    jumlahSesi: "3 Sesi",
    fokusMateri: "Perbaikan & integrasi dua robot Jurassic, riset tema dan penentuan ide Creative Design, mulai bangun prototipe, Simulasi Kompetisi I (Sesi 8–10)",
    fokus: "Perbaikan & integrasi dua robot Jurassic, riset tema dan penentuan ide Creative Design, mulai bangun prototipe, Simulasi Kompetisi I (Sesi 8–10)",
  },
  {
    minggu: "Pekan 3",
    pekan: "Pekan 3",
    periode: "30 Nov – 6 Des 2026",
    tanggal: "30 Nov – 6 Des 2026",
    jumlahSesi: "6 Sesi",
    fokusMateri: "Prototipe & pemrograman Creative Design, naskah presentasi bahasa Inggris, poster & manual, Simulasi Kompetisi II–III, pembekuan program Jurassic (Sesi 11–16)",
    fokus: "Prototipe & pemrograman Creative Design, naskah presentasi bahasa Inggris, poster & manual, Simulasi Kompetisi II–III, pembekuan program Jurassic (Sesi 11–16)",
  },
  {
    minggu: "Pekan 4",
    pekan: "Pekan 4",
    periode: "7 – 9 Des 2026",
    tanggal: "7 – 9 Des 2026",
    jumlahSesi: "3 Sesi",
    fokusMateri: "Final check, packing kit untuk perjalanan udara, briefing keberangkatan, cek alat Creative dan presentasi latihan (Sesi 17–19)",
    fokus: "Final check, packing kit untuk perjalanan udara, briefing keberangkatan, cek alat Creative dan presentasi latihan (Sesi 17–19)",
  },
];

/** Rencana pengurusan visa China (CVASC Jakarta) */
export const VISA_TIMELINE = [
  {
    tahap: "1. Surat Undangan Resmi IYRC",
    targetWaktu: "4 Nov 2026 (Selesai)",
    penanggungJawab: "Robotic Explorer → Direktorat",
    waktu: "4 Nov 2026",
    kegiatan: "Official Invitation Letter dari IYRA & My Robot Time Co., Ltd. telah diterima (lampiran Appendix A daftar nama). Diteruskan ke Direktorat sebagai dasar permohonan Izin Perjalanan Dinas LN (Direktur ST → Sekjen → Setneg).",
    pj: "Robotic Explorer → Direktorat",
  },
  {
    tahap: "2. Pengumpulan Berkas Peserta",
    targetWaktu: "4 – 13 Nov 2026",
    penanggungJawab: "Robotic Explorer & Tim SNT",
    waktu: "4 – 13 Nov 2026",
    kegiatan: "Pengumpulan scan paspor (masa berlaku min. 6 bulan), pas foto latar putih 33×48mm, KTP, Kartu Keluarga, dan surat izin orang tua untuk siswa.",
    pj: "Robotic Explorer & Tim SNT",
  },
  {
    tahap: "3. Paspor & Asuransi Perjalanan",
    targetWaktu: "Segera (Bulan Nov)",
    penanggungJawab: "Pemerintah Daerah / SNT Masing-masing",
    waktu: "Segera",
    kegiatan: "Penerbitan paspor bagi peserta yang belum memiliki serta asuransi perjalanan internasional (ditanggung daerah masing-masing sesuai RAB Rincian II C.2 & C.3).",
    pj: "Kota/daerah masing-masing",
  },
  {
    tahap: "4. Pengajuan Visa di CVASC Jakarta",
    targetWaktu: "16 – 20 Nov 2026",
    penanggungJawab: "Robotic Explorer & Peserta",
    waktu: "16 – 20 Nov 2026",
    kegiatan: "Pengajuan berkas visa ke Chinese Visa Application Service Center (CVASC) Jakarta. Siswa sudah berada di Jakarta sejak 15 Nov untuk perekaman biometrik / sidik jari.",
    pj: "Peserta/SNT & Robotic Explorer",
  },
  {
    tahap: "5. Penerbitan Visa China",
    targetWaktu: "s.d. 27 Nov 2026",
    penanggungJawab: "Kedutaan Besar RRT / CVASC",
    waktu: "s.d. ±27 Nov 2026",
    kegiatan: "Penerbitan visa reguler (estimasi 4 hari kerja setelah verifikasi berkas lengkap di CVASC).",
    pj: "Kedutaan Besar RRT / CVASC",
  },
  {
    tahap: "6. Buffer / Waktu Cadangan",
    targetWaktu: "28 Nov – 10 Des 2026",
    penanggungJawab: "Tim Delegasi",
    waktu: "s.d. 11 Des 2026",
    kegiatan: "Periode aman mitigasi jika terdapat permintaan dokumen tambahan atau verifikasi lanjutan sebelum keberangkatan 11 Des.",
    pj: "Tim Delegasi",
  },
];

export const VISA_DOCUMENTS = [
  "Paspor asli (masa berlaku minimal 6 bulan) dan pas foto sesuai ketentuan visa China (33×48 mm latar putih)",
  "Invitation letter resmi dari panitia IYRC (sudah diterima 4 Nov 2026)",
  "Bukti booking tiket pesawat pulang-pergi (China Southern CZ8056/CZ8353) dan booking hotel resmi Shenzhen",
  "Siswa di bawah 18 tahun: akta kelahiran, Kartu Keluarga, dan surat izin orang tua/wali bermeterai",
  "Pemohon usia 14 tahun ke atas wajib hadir untuk perekaman biometrik (sidik jari) di CVASC Jakarta",
];

/** Itinerary utama (10–15 Desember 2026 – tanpa study tour) */
export const MAIN_ITINERARY = [
  {
    hariTanggal: "Minggu, 15 Nov 2026",
    tanggal: "Minggu, 15 Nov 2026",
    waktu: "Tentatif (Pagi/Siang)",
    kegiatan: "Siswa delegasi tiba di Jakarta dari daerah asal masing-masing (SNT 5 Tidore, SNT 10 Kupang, SNT 15 Buton Tengah, SNT 17 Tanjabtim)",
    lokasiKeterangan: "Bandara Soekarno-Hatta (CGK) → Akomodasi Pelatihan (Grogol, Jakarta Barat)",
    menginap: "Akomodasi pelatihan siswa di Jakarta",
  },
  {
    hariTanggal: "16 Nov – 9 Des 2026",
    tanggal: "16 Nov – 9 Des 2026",
    waktu: "19 Sesi (@ 4 Jam)",
    kegiatan: "Pelatihan intensif robotika & AI IYRC di Robotic Explorer Center: pemrograman CodeSpark 3, misi Jurassic Survival, Sumo, prototipe Creative Design, presentasi bahasa Inggris",
    lokasiKeterangan: "Robotic Explorer Center, Greenville Blok AL No. 1A–B, Jakarta Barat",
    menginap: "Akomodasi pelatihan siswa di Jakarta",
  },
  {
    hariTanggal: "Kamis, 10 Des 2026",
    tanggal: "Kamis, 10 Des 2026",
    waktu: "Sepanjang Hari",
    kegiatan: "Kedatangan guru pendamping di Jakarta dari daerah asal; briefing teknis keberangkatan rombongan delegasi & pengecekan akhir dokumen/kit",
    lokasiKeterangan: "Robotic Explorer Center / Bandara Soekarno-Hatta (CGK)",
    menginap: "Siswa: akomodasi pelatihan · Pendamping: mandiri / sesuai koordinasi",
  },
  {
    hariTanggal: "Jumat, 11 Des 2026",
    tanggal: "Jumat, 11 Des 2026",
    waktu: "05.30 – 18.00 CST",
    kegiatan: "Berkumpul di Bandara Soekarno-Hatta Terminal 3 (05.30 WIB). Penerbangan China Southern CZ8056 (09.05 WIB) → Tiba di Shenzhen Bao'an SZX T3 (15.25 CST). Penjemputan van ke Zhongbao International Hotel, check-in & registrasi tim",
    lokasiKeterangan: "CGK T3 → Penerbangan CZ8056 → SZX T3 → Zhongbao International Hotel",
    menginap: "Zhongbao International Hotel, Longhua, Shenzhen",
  },
  {
    hariTanggal: "Sabtu, 12 Des 2026",
    tanggal: "Sabtu, 12 Des 2026",
    waktu: "08.00 – 17.30 CST",
    kegiatan: "Hari Kompetisi I The 14th IYRC: Opening Ceremony, Technical Inspection, Pertandingan Babak Penyisihan Kategori Jurassic Explorer & Sumo Robot",
    lokasiKeterangan: "Longgang International Arts Center, Shenzhen",
    menginap: "Zhongbao International Hotel, Longhua, Shenzhen",
  },
  {
    hariTanggal: "Minggu, 13 Des 2026",
    tanggal: "Minggu, 13 Des 2026",
    waktu: "08.30 – 18.00 CST",
    kegiatan: "Hari Kompetisi II The 14th IYRC: Babak Final, Penjurian & Presentasi Creative Design AI Robot, Awarding & Closing Ceremony, Pembagian Medali & Sertifikat Juara",
    lokasiKeterangan: "Longgang International Arts Center, Shenzhen",
    menginap: "Zhongbao International Hotel, Longhua, Shenzhen",
  },
  {
    hariTanggal: "Senin, 14 Des 2026",
    tanggal: "Senin, 14 Des 2026",
    waktu: "12.00 – 23.20 WIB",
    kegiatan: "Check-out Zhongbao Hotel (12.00 CST). Transfer van ke Bandara Shenzhen Bao'an SZX T3 (16.00 CST). Penerbangan kepulangan China Southern CZ8353 (19.05 CST) → Tiba di Jakarta CGK T3 (23.20 WIB)",
    lokasiKeterangan: "Zhongbao Hotel → SZX T3 → Penerbangan CZ8353 → Bandara Soekarno-Hatta (CGK) T3",
    menginap: "Transit Bandara Soekarno-Hatta (menunggu jadwal penerbangan subuh)",
  },
  {
    hariTanggal: "Selasa, 15 Des 2026",
    tanggal: "Selasa, 15 Des 2026",
    waktu: "Subuh / Pagi Hari",
    kegiatan: "Penerbangan domestik lanjutan dari Jakarta kembali ke daerah asal masing-masing siswa dan pendamping (Tidore, Kupang, Buton Tengah, Jambi)",
    lokasiKeterangan: "Bandara Soekarno-Hatta (CGK) → Bandara Daerah Asal",
    menginap: "–",
  },
];

/** Itinerary opsi study tour (14–17 Des 2026) */
export const STUDY_TOUR_ITINERARY = [
  {
    hariTanggal: "Senin, 14 Des 2026",
    tanggal: "Senin, 14 Des 2026",
    waktu: "12.00 – 18.00 CST",
    kegiatan: "Check-out dari Zhongbao Hotel paket kompetisi. Pindah ke akomodasi study tour & orientasi program kunjungan teknologi Shenzhen",
    lokasiKeterangan: "Shenzhen High-Tech Industrial Park & Akomodasi Study Tour",
    menginap: "Hotel Program Study Tour Shenzhen",
  },
  {
    hariTanggal: "Selasa, 15 Des 2026",
    tanggal: "Selasa, 15 Des 2026",
    waktu: "09.00 – 17.00 CST",
    kegiatan: "Kunjungan edukasi industri robotika, pusat inovasi sains & teknologi Shenzhen, pertukaran pelajar internasional & workshop AI lanjutan",
    lokasiKeterangan: "Pusat Sains & Pusat Robotika Shenzhen",
    menginap: "Hotel Program Study Tour Shenzhen",
  },
  {
    hariTanggal: "Rabu, 16 Des 2026",
    tanggal: "Rabu, 16 Des 2026",
    waktu: "Tentatif (Siang/Sore)",
    kegiatan: "Penutupan program study tour, transfer rombongan ke Bandara Internasional Guangzhou Baiyun (CAN), penerbangan kepulangan ke Jakarta (CGK)",
    lokasiKeterangan: "Shenzhen → Bandara Guangzhou Baiyun (CAN) → Jakarta (CGK)",
    menginap: "Transit Bandara Soekarno-Hatta",
  },
  {
    hariTanggal: "Kamis, 17 Des 2026",
    tanggal: "Kamis, 17 Des 2026",
    waktu: "Pagi / Siang",
    kegiatan: "Penerbangan domestik lanjutan dari Jakarta kembali ke daerah asal masing-masing siswa dan pendamping",
    lokasiKeterangan: "Bandara Soekarno-Hatta (CGK) → Daerah Asal",
    menginap: "–",
  },
];

/**
 * Kalkulasi ulang RAB secara dinamis berdasarkan jumlah siswa dan pendamping.
 * - Rincian I  : A.1–A.4 per siswa, A.5 tetap 3 kategori (jika ada siswa), B.1 per pendamping.
 * - Rincian II : per personel (visa, tiket, transport lokal), transport rombongan per van (maks 7 orang).
 * - Opsi Study Tour (F.1/F.2) dihitung terpisah, tidak disimpan di database.
 */
export function calculateDynamicRab(
  countSiswa: number,
  countPendamping: number,
  currentItems?: any[],
  options?: { studyTour?: boolean }
) {
  const totalPersonel = countSiswa + countPendamping;
  const items = currentItems && currentItems.length > 0 ? JSON.parse(JSON.stringify(currentItems)) : JSON.parse(JSON.stringify(DEFAULT_IYRC_BUDGET_ITEMS));
  const vanTrips = Math.max(1, Math.ceil(totalPersonel / 7)) * 2;

  let totalTanggunganRobotic = 0;
  let totalTanggunganPeserta = 0;
  let subtotalA = 0;

  items.forEach((item: any) => {
    switch (item.code) {
      case "A.1":
      case "A.2":
      case "A.3":
      case "A.4":
        item.volume = countSiswa;
        item.tanggunganRobotic = countSiswa * item.hargaSatuan;
        item.tanggunganPeserta = 0;
        break;
      case "A.5":
        item.volume = countSiswa > 0 ? IYRC_PACKAGE.categoryCount : 0;
        item.tanggunganRobotic = item.volume * item.hargaSatuan;
        item.tanggunganPeserta = 0;
        break;
      case "B.1":
        item.volume = countPendamping;
        item.tanggunganRobotic = countPendamping * item.hargaSatuan;
        item.tanggunganPeserta = 0;
        break;
      case "C.1":
      case "C.2":
      case "C.3":
      case "D.1":
      case "D.2":
      case "E.1":
      case "E.4":
        item.volume = totalPersonel;
        item.tanggunganRobotic = 0;
        item.tanggunganPeserta = totalPersonel * item.hargaSatuan;
        break;
      case "D.3":
      case "E.2":
        item.volume = totalPersonel > 0 ? vanTrips : 0;
        item.tanggunganRobotic = 0;
        item.tanggunganPeserta = item.volume * item.hargaSatuan;
        break;
      case "E.3":
        item.volume = totalPersonel * 2;
        item.tanggunganRobotic = 0;
        item.tanggunganPeserta = item.volume * item.hargaSatuan;
        break;
      default:
        break;
    }

    if (item.kategori === "A") subtotalA += item.tanggunganRobotic || 0;
    totalTanggunganRobotic += item.tanggunganRobotic || 0;
    totalTanggunganPeserta += item.tanggunganPeserta || 0;
  });

  const b1 = items.find((i: any) => i.code === "B.1");
  const pendampingPackage = b1?.hargaSatuan ?? IYRC_PACKAGE.pendampingPackage;

  // Opsi Study Tour
  const studyTourEnabled = !!options?.studyTour;
  const studyTourSiswa = countSiswa * IYRC_PACKAGE.studyTourPerPerson;
  const studyTourPendamping = countPendamping * IYRC_PACKAGE.studyTourPerPerson;
  const studyTourTotal = studyTourSiswa + studyTourPendamping;
  const studyTourAddPerPerson = studyTourEnabled ? IYRC_PACKAGE.studyTourPerPerson : 0;

  const totalTransferRobotic = totalTanggunganRobotic + (studyTourEnabled ? studyTourTotal : 0);

  const biayaKompetisiPerSiswa = (countSiswa > 0 ? Math.round(subtotalA / countSiswa) : 0) + studyTourAddPerPerson;
  const biayaKompetisiPerPendamping = pendampingPackage + studyTourAddPerPerson;
  const perPersonTravelFee = totalPersonel > 0 ? Math.round(totalTanggunganPeserta / totalPersonel) : 0;

  return {
    items,
    countSiswa,
    countPendamping,
    totalPersonel,
    subtotalA,
    subtotalB: countPendamping * pendampingPackage,
    totalTanggunganRobotic,
    totalTanggunganPeserta,
    totalTransferRobotic,
    totalKeseluruhan: totalTransferRobotic + totalTanggunganPeserta,
    perPersonTravelFee,
    biayaKompetisiPerSiswa,
    biayaKompetisiPerPendamping,
    biayaPerSiswa: biayaKompetisiPerSiswa + perPersonTravelFee,
    biayaPerPendamping: biayaKompetisiPerPendamping + perPersonTravelFee,
    studyTour: {
      enabled: studyTourEnabled,
      perPerson: IYRC_PACKAGE.studyTourPerPerson,
      siswa: studyTourSiswa,
      pendamping: studyTourPendamping,
      total: studyTourTotal,
    },
  };
}

/** Terbilang Rupiah (Bahasa Indonesia) */
export function terbilang(n: number): string {
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  const f = (x: number): string => {
    x = Math.floor(x);
    if (x < 12) return satuan[x];
    if (x < 20) return f(x - 10) + " belas";
    if (x < 100) return f(x / 10) + " puluh" + (x % 10 ? " " + f(x % 10) : "");
    if (x < 200) return "seratus" + (x - 100 ? " " + f(x - 100) : "");
    if (x < 1000) return f(x / 100) + " ratus" + (x % 100 ? " " + f(x % 100) : "");
    if (x < 2000) return "seribu" + (x - 1000 ? " " + f(x - 1000) : "");
    if (x < 1e6) return f(x / 1000) + " ribu" + (x % 1000 ? " " + f(x % 1000) : "");
    if (x < 1e9) return f(x / 1e6) + " juta" + (x % 1e6 ? " " + f(x % 1e6) : "");
    if (x < 1e12) return f(x / 1e9) + " miliar" + (x % 1e9 ? " " + f(x % 1e9) : "");
    return f(x / 1e12) + " triliun" + (x % 1e12 ? " " + f(x % 1e12) : "");
  };
  if (!n) return "Nol rupiah";
  const s = f(n).trim().replace(/\s+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1) + " rupiah";
}

// ==================== LABA RUGI, RAB & PAGU IYRC CHINA 2026 (upNov26) ====================

export const IYRC_PNL_VERSION = "26 November 2026 (upNov26)";

export const IYRC_PNL_ASSUMPTIONS = {
  usdToIdr: 18500,
  flightPerPerson: 6500000,
  visaPerPerson: 1500000,
  insurancePerPerson: 300000,
  ticketVisaInsurancePerPerson: 8300000,
  sntTravelCount: 6,
  grethaTravelCount: 1,
  reStaffTravelCount: 3, // Wisnu Budi Prasetyo, Agung Ramadhan, Jully Tjindrawan (tiket Lauw Mei Hoa dipisah di Bagian 8)
  tunasBangsaTravelCount: 0,
  kitModalUsdPerChild: 190,
  creativeKitModalIdrPerChild: 2000000,
  kitCountSnt: 4,
  kitCountGretha: 1,
  kitCountTunasBangsa: 2,
};

export type IyrcProgramKey = "SNT" | "GRETHA" | "TUNAS_BANGSA" | "KIT_SNT" | "STAF_RE";

export const IYRC_PROGRAM_OPTIONS: Array<{
  key: IyrcProgramKey;
  label: string;
  shortLabel: string;
}> = [
  { key: "SNT", label: "SNT – RAB Kemendikdasmen", shortLabel: "SNT" },
  { key: "GRETHA", label: "Gretha – Pemda Kab. Kupang", shortLabel: "Gretha" },
  { key: "TUNAS_BANGSA", label: "Tunas Bangsa – 2 Siswa + Pak Hardian", shortLabel: "Tunas Bangsa" },
  { key: "KIT_SNT", label: "Pengadaan Kit SNT – Surat Penawaran 001", shortLabel: "Kit SNT" },
  { key: "STAF_RE", label: "Staf RE & Biaya Bersama", shortLabel: "Staf RE / Bersama" },
];

export interface IyrcRevenueSeedItem {
  budgetPos: string;
  program: "SNT" | "GRETHA" | "TUNAS_BANGSA" | "KIT_SNT";
  programLabel: string;
  description: string;
  category: string;
  qty: number;
  unitPrice: number;
  amount: number;
  initialStatus: "PENDING" | "COMPLETED";
  defaultDate: string;
  vendorName: string;
  invoiceNumber: string | null;
  defaultAccountCode: string;
  sourceNote: string;
}

export interface IyrcExpenseBudgetPos {
  key: "MY_ROBOT" | "KIT_PPN" | "HOTEL" | "TIKET_VISA" | "TAMBAHAN";
  code: string;
  label: string;
  shortLabel: string;
  budgetAmount: number;
  defaultCategory: string;
  defaultAccountCode: string;
  description: string;
}

export interface IyrcProgramSummaryBudget {
  program: IyrcProgramKey;
  label: string;
  revenueBudget: number;
  expenseBudget: number;
  profitBudget: number;
  allocationNote: string;
}

export interface IyrcMyRobotLineItem {
  id: string;
  description: string;
  qty: number;
  unitUsd: number;
  totalUsd: number;
  program: IyrcProgramKey;
  participants: string;
}

export interface IyrcHotel88LineItem {
  id: string;
  description: string;
  qty: number;
  nightsOrDays: number;
  unitPrice: number;
  totalIdr: number;
  period: string;
  sharedWithGretha: boolean;
}

export interface IyrcAdditionalExpenseSeedItem {
  seedKey: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  currency: "IDR" | "USD";
  originalAmount: number;
  exchangeRate: number;
  amount: number;
  program: IyrcProgramKey;
  allocationLabel: string;
  budgetPos: "TAMBAHAN";
  initialStatus: "COMPLETED" | "PENDING";
  paymentMethod: "TRANSFER" | "BANK" | "CASH";
  vendorName: string;
  invoiceNumber: string | null;
  defaultAccountCode: string;
  proofNote: string;
}

export const IYRC_REVENUE_ITEMS: IyrcRevenueSeedItem[] = [
  {
    budgetPos: "REV_SNT_1",
    program: "SNT",
    programLabel: "SNT – Kemendikdasmen",
    description: "RAB SNT – Rincian I (kompetisi, guru, akomodasi Jakarta)",
    category: "Pendapatan RAB SNT Rincian I",
    qty: 1,
    unitPrice: 146400000,
    amount: 146400000,
    initialStatus: "PENDING",
    defaultDate: "2026-11-09",
    vendorName: "Kemendikdasmen (Program SNT Wilayah 2)",
    invoiceNumber: "RAB-SNT-W2-R1-091126",
    defaultAccountCode: "400.10.105",
    sourceNote: "RAB SNT Wilayah 2, versi 9 Nov 2026",
  },
  {
    budgetPos: "REV_SNT_2",
    program: "SNT",
    programLabel: "SNT – Kemendikdasmen",
    description: "RAB SNT – Rincian II (visa, asuransi, perjalanan internasional)",
    category: "Pendapatan RAB SNT Rincian II",
    qty: 1,
    unitPrice: 61195360,
    amount: 61195360,
    initialStatus: "PENDING",
    defaultDate: "2026-11-09",
    vendorName: "Kemendikdasmen (Program SNT Wilayah 2)",
    invoiceNumber: "RAB-SNT-W2-R2-091126",
    defaultAccountCode: "400.10.105",
    sourceNote: "RAB SNT Wilayah 2, versi 9 Nov 2026",
  },
  {
    budgetPos: "REV_GRETHA",
    program: "GRETHA",
    programLabel: "Gretha – Pemda Kab. Kupang",
    description: "Biaya Peserta IYRC Pemda Kupang a.n Gretha Gratia Tameno",
    category: "Peserta IYRC Pemda Kupang",
    qty: 1,
    unitPrice: 47150000,
    amount: 47150000,
    initialStatus: "COMPLETED",
    defaultDate: "2026-11-11",
    vendorName: "Pemda Kab. Kupang",
    invoiceNumber: "INV/REX/SNT-IYRC/XI/2026/002",
    defaultAccountCode: "400.10.104",
    sourceNote: "INV/REX/SNT-IYRC/XI/2026/002 (Sudah Lunas)",
  },
  {
    budgetPos: "REV_TUNAS_BANGSA",
    program: "TUNAS_BANGSA",
    programLabel: "Tunas Bangsa",
    description: "Tunas Bangsa – 2 siswa (Benjamin & Sebastian, tidak termasuk tiket & visa)",
    category: "Peserta IYRC Tunas Bangsa",
    qty: 2,
    unitPrice: 36500000,
    amount: 73000000,
    initialStatus: "PENDING",
    defaultDate: "2026-11-10",
    vendorName: "Sekolah Tunas Bangsa",
    invoiceNumber: "INV-IYRC-TB-2026",
    defaultAccountCode: "400.10.104",
    sourceNote: "2 siswa × Rp 36.500.000",
  },
  {
    budgetPos: "REV_EXTEND",
    program: "TUNAS_BANGSA",
    programLabel: "Tunas Bangsa",
    description: "Pak Hardian – tambahan extend paket 4D3N → 6D5N",
    category: "Tambahan Paket IYRC",
    qty: 1,
    unitPrice: 6500000,
    amount: 6500000,
    initialStatus: "PENDING",
    defaultDate: "2026-11-10",
    vendorName: "Pak Hardian (Tunas Bangsa)",
    invoiceNumber: "EXT-IYRC-HARDIAN-2026",
    defaultAccountCode: "400.10.104",
    sourceNote: "Menunggu konfirmasi & transfer Pak Hardian",
  },
  {
    budgetPos: "REV_KIT_SNT",
    program: "KIT_SNT",
    programLabel: "Pengadaan Kit SNT",
    description: "Surat Penawaran pengadaan robot kit + creative kit SNT (termasuk PPN)",
    category: "Penjualan Kit SNT IYRC",
    qty: 1,
    unitPrice: 42400000,
    amount: 42400000,
    initialStatus: "PENDING",
    defaultDate: "2026-11-10",
    vendorName: "Pengadaan Kit SNT (Kemendikdasmen)",
    invoiceNumber: "001/SPH/REX/XI/2026",
    defaultAccountCode: "400.10.102",
    sourceNote: "001/SPH/REX/XI/2026 (4 siswa × Rp 10.600.000 incl. PPN)",
  },
];

/** Bagian 2 Excel: Rincian Invoice MY-ROBOT WW2611-00002 (USD 7.070) */
export const IYRC_MY_ROBOT_ITEMS: IyrcMyRobotLineItem[] = [
  {
    id: "mr-tb-siswa",
    description: "Students Registration Fee – 6D5N (Tunas Bangsa)",
    qty: 2,
    unitUsd: 780,
    totalUsd: 1560,
    program: "TUNAS_BANGSA",
    participants: "Benjamin Jonathan Sudartha, Sebastian Daryl Limanus",
  },
  {
    id: "mr-tb-hardian",
    description: "Parents/Instructors – 6D5N (Tunas Bangsa)",
    qty: 1,
    unitUsd: 880,
    totalUsd: 880,
    program: "TUNAS_BANGSA",
    participants: "Hardian",
  },
  {
    id: "mr-snt-siswa",
    description: "Students Registration Fee – 4D3N (SNT)",
    qty: 4,
    unitUsd: 530,
    totalUsd: 2120,
    program: "SNT",
    participants: "Nahjul, Prince, Bunga, Shabiq",
  },
  {
    id: "mr-gretha",
    description: "Students Registration Fee – 4D3N (Gretha)",
    qty: 1,
    unitUsd: 590,
    totalUsd: 590,
    program: "GRETHA",
    participants: "Gretha Gratia Tameno",
  },
  {
    id: "mr-snt-guru",
    description: "Parents/Instructors – 4D3N (guru SNT)",
    qty: 2,
    unitUsd: 480,
    totalUsd: 960,
    program: "SNT",
    participants: "Chindra Saputra, Farid AM",
  },
  {
    id: "mr-staf-re",
    description: "Parents/Instructors – 4D3N (staf RE)",
    qty: 2,
    unitUsd: 480,
    totalUsd: 960,
    program: "STAF_RE",
    participants: "Wisnu Budi Prasetyo, Agung Ramadhan",
  },
  {
    id: "mr-jully-foc",
    description: "Parents/Instructors – 4D3N (FOC)",
    qty: 1,
    unitUsd: 0,
    totalUsd: 0,
    program: "STAF_RE",
    participants: "Jully Tjindrawan",
  },
];

/** Bagian 4 Excel: Rincian Hotel 88 Kedoya (Jakarta) – Total Rp 32.550.000 */
export const IYRC_HOTEL_88_ITEMS: IyrcHotel88LineItem[] = [
  {
    id: "h88-putra",
    description: "Superior Twin – siswa putra",
    qty: 1,
    nightsOrDays: 26,
    unitPrice: 350000,
    totalIdr: 9100000,
    period: "15 Nov – 11 Des",
    sharedWithGretha: true,
  },
  {
    id: "h88-putri",
    description: "Deluxe Double Bed – siswa putri",
    qty: 1,
    nightsOrDays: 26,
    unitPrice: 350000,
    totalIdr: 9100000,
    period: "15 Nov – 11 Des",
    sharedWithGretha: true,
  },
  {
    id: "h88-extrabed",
    description: "Extrabed – kamar putri",
    qty: 1,
    nightsOrDays: 26,
    unitPrice: 150000,
    totalIdr: 3900000,
    period: "15 Nov – 11 Des",
    sharedWithGretha: true,
  },
  {
    id: "h88-chindra",
    description: "Superior Double Bed – Pak Chindra",
    qty: 1,
    nightsOrDays: 10,
    unitPrice: 350000,
    totalIdr: 3500000,
    period: "1 – 11 Des",
    sharedWithGretha: false,
  },
  {
    id: "h88-farid",
    description: "Deluxe Double Bed – Pak Farid",
    qty: 1,
    nightsOrDays: 2,
    unitPrice: 350000,
    totalIdr: 700000,
    period: "9 – 11 Des",
    sharedWithGretha: false,
  },
  {
    id: "h88-lunch",
    description: "Lunch & Coffee Break – 5 siswa",
    qty: 5,
    nightsOrDays: 25,
    unitPrice: 50000,
    totalIdr: 6250000,
    period: "16 Nov – 10 Des",
    sharedWithGretha: true,
  },
];

/** Bagian 8 Excel: 13 Item Realisasi Biaya Tambahan s.d. 26 Nov 2026 (Total Rp 29.577.800) */
export const IYRC_ADDITIONAL_EXPENSE_ITEMS: IyrcAdditionalExpenseSeedItem[] = [
  {
    seedKey: "ADD_TIKET_LAUW",
    date: "2026-11-16",
    description: "Tiket pesawat Lauw Mei Hoa CGK–SZX PP (China Southern)",
    category: "Pos 6 - Biaya Tambahan IYRC (Tiket)",
    currency: "IDR",
    originalAmount: 7361300,
    exchangeRate: 1,
    amount: 7361300,
    program: "STAF_RE",
    allocationLabel: "Bersama",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Traveloka / China Southern Airlines",
    invoiceNumber: "TVLK-1881977519109862449",
    defaultAccountCode: "600.10.026",
    proofNote: "Traveloka #1881977519109862449; berangkat 11 Des, pulang 14 Des; termasuk service fee Rp67.500",
  },
  {
    seedKey: "ADD_TRAINER_MRT",
    date: "2026-11-25",
    description: "Trainer MRT Malaysia – Instructor Training Fee 2 pax (2–3 Des)",
    category: "Pos 6 - Biaya Tambahan IYRC (Trainer)",
    currency: "USD",
    originalAmount: 1166,
    exchangeRate: 18500,
    amount: 21571000,
    program: "TUNAS_BANGSA",
    allocationLabel: "Tunas Bangsa",
    budgetPos: "TAMBAHAN",
    initialStatus: "PENDING",
    paymentMethod: "BANK",
    vendorName: "MY-ROBOT WORLDWIDE SDN BHD",
    invoiceNumber: "WW2611-00009",
    defaultAccountCode: "600.10.027",
    proofNote: "Invoice MY-ROBOT WW2611-00009 (USD 1.166 × kurs Rp18.500) – menunggu transfer/kurs aktual",
  },
  {
    seedKey: "ADD_LAUNDRY_1",
    date: "2026-11-18",
    description: "Laundry – Kotak Laundry Green Garden (18 Nov)",
    category: "Pos 6 - Biaya Tambahan IYRC (Laundry)",
    currency: "IDR",
    originalAmount: 77000,
    exchangeRate: 1,
    amount: 77000,
    program: "SNT",
    allocationLabel: "SNT",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kotak Laundry Green Garden",
    invoiceNumber: "SWY261118192558556",
    defaultAccountCode: "600.10.032",
    proofNote: "Nota SWY261118192558556",
  },
  {
    seedKey: "ADD_LAUNDRY_2",
    date: "2026-11-19",
    description: "Laundry – Kotak Laundry Green Garden (19 Nov)",
    category: "Pos 6 - Biaya Tambahan IYRC (Laundry)",
    currency: "IDR",
    originalAmount: 32000,
    exchangeRate: 1,
    amount: 32000,
    program: "SNT",
    allocationLabel: "SNT",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kotak Laundry Green Garden",
    invoiceNumber: "DOM261119135032102",
    defaultAccountCode: "600.10.032",
    proofNote: "Nota DOM261119135032102",
  },
  {
    seedKey: "ADD_LAUNDRY_3",
    date: "2026-11-23",
    description: "Laundry – Kotak Laundry Green Garden (23 Nov)",
    category: "Pos 6 - Biaya Tambahan IYRC (Laundry)",
    currency: "IDR",
    originalAmount: 135000,
    exchangeRate: 1,
    amount: 135000,
    program: "SNT",
    allocationLabel: "SNT",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kotak Laundry Green Garden",
    invoiceNumber: "SCO261123085814898",
    defaultAccountCode: "600.10.032",
    proofNote: "Nota SCO261123085814898",
  },
  {
    seedKey: "ADD_PRINT_WINNER",
    date: "2026-09-28",
    description: "Print game mat trip bahan flexy cina 244×123 cm (Winner)",
    category: "Pos 6 - Biaya Tambahan IYRC (Print & Maket)",
    currency: "IDR",
    originalAmount: 112000,
    exchangeRate: 1,
    amount: 112000,
    program: "STAF_RE",
    allocationLabel: "Bersama",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Winner Printing",
    invoiceNumber: "38/WN/IX/26",
    defaultAccountCode: "600.10.032",
    proofNote: "Kwitansi Winner No. 38/WN/IX/26",
  },
  {
    seedKey: "ADD_PRINT_MAKET_0411",
    date: "2026-11-04",
    description: "Print – bayar maket IYRC",
    category: "Pos 6 - Biaya Tambahan IYRC (Print & Maket)",
    currency: "IDR",
    originalAmount: 23000,
    exchangeRate: 1,
    amount: 23000,
    program: "STAF_RE",
    allocationLabel: "Bersama",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kijanto Sudarmawan",
    invoiceNumber: "BCA-PRN-20261104",
    defaultAccountCode: "600.10.032",
    proofNote: "m-Transfer BCA ke Kijanto Sudarmawan",
  },
  {
    seedKey: "ADD_PRINT_BANNER_0711",
    date: "2026-11-07",
    description: "Print – banner IYRC",
    category: "Pos 6 - Biaya Tambahan IYRC (Print & Maket)",
    currency: "IDR",
    originalAmount: 23000,
    exchangeRate: 1,
    amount: 23000,
    program: "STAF_RE",
    allocationLabel: "Bersama",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kijanto Sudarmawan",
    invoiceNumber: "BCA-PRN-20261107",
    defaultAccountCode: "600.10.032",
    proofNote: "m-Transfer BCA ke Kijanto Sudarmawan",
  },
  {
    seedKey: "ADD_PRINT_BANNER_MAKET_1211",
    date: "2026-11-12",
    description: "Print – cetak banner maket IYRC",
    category: "Pos 6 - Biaya Tambahan IYRC (Print & Maket)",
    currency: "IDR",
    originalAmount: 23000,
    exchangeRate: 1,
    amount: 23000,
    program: "STAF_RE",
    allocationLabel: "Bersama",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kijanto Sudarmawan",
    invoiceNumber: "BCA-PRN-20261112",
    defaultAccountCode: "600.10.032",
    proofNote: "m-Transfer BCA ke Kijanto Sudarmawan",
  },
  {
    seedKey: "ADD_PRINT_BANNER_2011",
    date: "2026-11-20",
    description: "Print – cetak banner",
    category: "Pos 6 - Biaya Tambahan IYRC (Print & Maket)",
    currency: "IDR",
    originalAmount: 149500,
    exchangeRate: 1,
    amount: 149500,
    program: "STAF_RE",
    allocationLabel: "Bersama",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kijanto Sudarmawan",
    invoiceNumber: "BCA-PRN-20261120",
    defaultAccountCode: "600.10.032",
    proofNote: "m-Transfer BCA ke Kijanto Sudarmawan",
  },
  {
    seedKey: "ADD_PRINT_NUSANTARA_2311",
    date: "2026-11-23",
    description: "Print – cetak banner Nusantara Bot",
    category: "Pos 6 - Biaya Tambahan IYRC (Print & Maket)",
    currency: "IDR",
    originalAmount: 23000,
    exchangeRate: 1,
    amount: 23000,
    program: "STAF_RE",
    allocationLabel: "Bersama",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kijanto Sudarmawan",
    invoiceNumber: "BCA-PRN-20261123",
    defaultAccountCode: "600.10.032",
    proofNote: "m-Transfer BCA ke Kijanto Sudarmawan",
  },
  {
    seedKey: "ADD_PRINT_KARTU_2511",
    date: "2026-11-25",
    description: "Print – cetak kartu Creative IYRC",
    category: "Pos 6 - Biaya Tambahan IYRC (Print & Maket)",
    currency: "IDR",
    originalAmount: 25000,
    exchangeRate: 1,
    amount: 25000,
    program: "STAF_RE",
    allocationLabel: "Bersama",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kijanto Sudarmawan",
    invoiceNumber: "BCA-PRN-20261125",
    defaultAccountCode: "600.10.032",
    proofNote: "m-Transfer BCA ke Kijanto Sudarmawan",
  },
  {
    seedKey: "ADD_PRINT_KARHUTLA_2611",
    date: "2026-11-26",
    description: "Print – maket Karhutla IYRC",
    category: "Pos 6 - Biaya Tambahan IYRC (Print & Maket)",
    currency: "IDR",
    originalAmount: 23000,
    exchangeRate: 1,
    amount: 23000,
    program: "STAF_RE",
    allocationLabel: "Bersama",
    budgetPos: "TAMBAHAN",
    initialStatus: "COMPLETED",
    paymentMethod: "TRANSFER",
    vendorName: "Kijanto Sudarmawan",
    invoiceNumber: "BCA-PRN-20261126",
    defaultAccountCode: "600.10.032",
    proofNote: "m-Transfer BCA ke Kijanto Sudarmawan",
  },
];

export const IYRC_EXPENSE_BUDGET_POSITIONS: IyrcExpenseBudgetPos[] = [
  {
    key: "MY_ROBOT",
    code: "Pos 2",
    label: "Invoice MY-ROBOT WW2611-00002 (USD)",
    shortLabel: "Invoice MY-ROBOT",
    budgetAmount: 130795000,
    defaultCategory: "Pos 2 - Registrasi MY-ROBOT",
    defaultAccountCode: "600.10.027",
    description: "$7.070 (6D5N TB $2.440, 4D3N SNT $2.120, Gretha $590, Guru SNT $960, Staf RE $960, Jully FOC) @ Rp 18.500",
  },
  {
    key: "KIT_PPN",
    code: "Pos 3",
    label: "Robot Kit, Creative Kit & PPN Keluaran",
    shortLabel: "Kit & PPN",
    budgetAmount: 42806802,
    defaultCategory: "Pos 3 - Robot Kit & PPN",
    defaultAccountCode: "500.10.102",
    description: "Modal kit 7 anak ($190 × Rp 18.500 + Rp 2.000.000 = Rp 38.605.000) + PPN keluaran kit SNT Rp 4.201.802",
  },
  {
    key: "HOTEL",
    code: "Pos 4",
    label: "Hotel 88 Kedoya (Jakarta)",
    shortLabel: "Hotel 88 Kedoya",
    budgetAmount: 32550000,
    defaultCategory: "Pos 4 - Akomodasi Hotel 88",
    defaultAccountCode: "600.10.026",
    description: "Kamar siswa putra/putri + extrabed (26 malam), Pak Chindra (10m), Pak Farid (2m), Lunch & Coffee Break 5 siswa (25h)",
  },
  {
    key: "TIKET_VISA",
    code: "Pos 5",
    label: "Tiket Pesawat, Visa China & Asuransi",
    shortLabel: "Tiket, Visa & Asuransi",
    budgetAmount: 83000000,
    defaultCategory: "Pos 5 - Tiket, Visa & Asuransi",
    defaultAccountCode: "600.10.026",
    description: "10 orang × Rp 8.300.000 (Tiket Rp 6,5 jt + Visa Rp 1,5 jt + Asuransi Rp 300 rb): 6 SNT, 1 Gretha, 3 Staf RE (Wisnu, Agung, Jully)",
  },
  {
    key: "TAMBAHAN",
    code: "Pos 6",
    label: "Biaya Tambahan Realisasi (Bagian 8 · upNov26)",
    shortLabel: "Biaya Tambahan",
    budgetAmount: 29577800,
    defaultCategory: "Pos 6 - Biaya Tambahan IYRC",
    defaultAccountCode: "600.10.032",
    description: "Realisasi s.d. 26 Nov: Trainer MRT $1.166 (Rp 21,57 jt), Tiket Lauw Mei Hoa (Rp 7,36 jt), Laundry 3x (Rp 244 rb), Print/Banner/Maket 8x (Rp 401,5 rb); belum termasuk Pembelian alat-alat",
  },
];

export const IYRC_PROGRAM_BREAKDOWN: IyrcProgramSummaryBudget[] = [
  {
    program: "SNT",
    label: "SNT – RAB Kemendikdasmen (Versi 9 Nov)",
    revenueBudget: 207595360,
    expenseBudget: 133904000,
    profitBudget: 73691360,
    allocationNote: "Paket MY-ROBOT 4 siswa + 2 guru, hotel (dikurangi porsi Gretha 1/5), tiket/visa/asuransi 6 orang; + laundry 3 nota (Rp 244 rb)",
  },
  {
    program: "GRETHA",
    label: "Gretha – Pemda Kab. Kupang",
    revenueBudget: 47150000,
    expenseBudget: 30400000,
    profitBudget: 16750000,
    allocationNote: "Paket MY-ROBOT ($590), porsi 1/5 kamar siswa & lunch, tiket/visa/asuransi, kit",
  },
  {
    program: "TUNAS_BANGSA",
    label: "Tunas Bangsa – 2 Siswa + Pak Hardian",
    revenueBudget: 79500000,
    expenseBudget: 77741000,
    profitBudget: 1759000,
    allocationNote: "Paket 6D5N 2 siswa + Hardian, kit 2 siswa; pendapatan termasuk extend Rp 6,5 jt; + Trainer MRT 2–3 Des ($1.166 = Rp 21,57 jt)",
  },
  {
    program: "KIT_SNT",
    label: "Pengadaan Kit SNT – Surat Penawaran 001",
    revenueBudget: 42400000,
    expenseBudget: 26261802,
    profitBudget: 16138198,
    allocationNote: "Modal kit 4 siswa + PPN keluaran disetor (Rp 4.201.802)",
  },
  {
    program: "STAF_RE",
    label: "Staf RE & Biaya Bersama",
    revenueBudget: 0,
    expenseBudget: 50422800,
    profitBudget: -50422800,
    allocationNote: "Paket Wisnu & Agung (Jully FOC), tiket/visa/asuransi 3 staf RE; + tiket Lauw Mei Hoa (Rp 7,36 jt), print/banner/maket (Rp 401,5 rb)",
  },
];

export const IYRC_UNBUDGETED_NOTES: string[] = [
  "Makan malam siswa selama di Jakarta (tabel hotel hanya mencakup lunch & coffee break, sementara invoice Gretha menagih makan siang & malam).",
  "Transport bandara ↔ hotel di Shenzhen, uang saku staf RE, dan honor pelatih internal.",
  "Potongan pajak oleh bendahara Kemendikdasmen / Pemda (PPN & PPh).",
  "Selisih kurs USD/IDR aktual dan biaya transfer internasional ke OCBC Malaysia.",
  "Pembelian alat-alat belum ada nota/nominal (baris kuning di Bagian 8 Excel).",
];

export const IYRC_PROFIT_LOSS_TOTALS = {
  totalRevenueBudget: 376645360,
  totalExpenseBudget: 318729602,
  projectedProfit: 57915758,
  projectedMarginPct: 15.376734761846,
};

/**
 * Simulator dinamis RAB & Laba Rugi IYRC upNov26 berdasarkan kurs USD aktual
 * dan estimasi nominal 'Pembelian alat-alat' (baris kuning Bagian 8 Excel).
 * Pada nilai default (usdToIdr = 18500, equipmentPurchaseEstimate = 0),
 * seluruh angka cocok 100% dengan Excel IYRC_China_2026_upNov26.xlsx.
 */
export function calculateIyrcUpNov26Scenario(params?: {
  usdToIdr?: number;
  equipmentPurchaseEstimate?: number;
}) {
  const usdToIdr = Math.max(1000, Math.round(params?.usdToIdr ?? IYRC_PNL_ASSUMPTIONS.usdToIdr));
  const equipmentPurchaseEstimate = Math.max(0, Math.round(params?.equipmentPurchaseEstimate ?? 0));

  const totalRevenue = IYRC_REVENUE_ITEMS.reduce((s, r) => s + r.amount, 0);

  // Bagian 2: MY-ROBOT WW2611-00002
  const myRobotRows = IYRC_MY_ROBOT_ITEMS.map((item) => ({
    ...item,
    totalIdr: item.totalUsd * usdToIdr,
  }));
  const totalMyRobotUsd = myRobotRows.reduce((s, r) => s + r.totalUsd, 0);
  const totalMyRobotIdr = myRobotRows.reduce((s, r) => s + r.totalIdr, 0);

  // Bagian 3: Robot Kit & Creative Kit + PPN
  const kitModalPerChild =
    IYRC_PNL_ASSUMPTIONS.kitModalUsdPerChild * usdToIdr +
    IYRC_PNL_ASSUMPTIONS.creativeKitModalIdrPerChild;
  const kitSntCost = IYRC_PNL_ASSUMPTIONS.kitCountSnt * kitModalPerChild;
  const kitGrethaCost = IYRC_PNL_ASSUMPTIONS.kitCountGretha * kitModalPerChild;
  const kitTbCost = IYRC_PNL_ASSUMPTIONS.kitCountTunasBangsa * kitModalPerChild;
  const kitSntRevenue = IYRC_REVENUE_ITEMS.find((r) => r.budgetPos === "REV_KIT_SNT")?.amount || 42400000;
  const ppnKitSnt = Math.round((kitSntRevenue * 11) / 111);
  const totalKitPpn = kitSntCost + kitGrethaCost + kitTbCost + ppnKitSnt;

  // Bagian 4: Hotel 88 Kedoya
  const totalHotel = IYRC_HOTEL_88_ITEMS.reduce((s, h) => s + h.totalIdr, 0);
  const sharedStudentHotel = IYRC_HOTEL_88_ITEMS.filter((h) => h.sharedWithGretha).reduce(
    (s, h) => s + h.totalIdr,
    0
  );
  const grethaHotelShare = Math.round(sharedStudentHotel / 5);
  const sntHotelShare = totalHotel - grethaHotelShare;

  // Bagian 5: Tiket, Visa & Asuransi
  const travelPerPerson = IYRC_PNL_ASSUMPTIONS.ticketVisaInsurancePerPerson;
  const travelRows = [
    {
      id: "tv-snt",
      label: "Peserta SNT (4 siswa + 2 guru)",
      count: IYRC_PNL_ASSUMPTIONS.sntTravelCount,
      perPerson: travelPerPerson,
      totalIdr: IYRC_PNL_ASSUMPTIONS.sntTravelCount * travelPerPerson,
      program: "SNT" as IyrcProgramKey,
    },
    {
      id: "tv-gretha",
      label: "Gretha",
      count: IYRC_PNL_ASSUMPTIONS.grethaTravelCount,
      perPerson: travelPerPerson,
      totalIdr: IYRC_PNL_ASSUMPTIONS.grethaTravelCount * travelPerPerson,
      program: "GRETHA" as IyrcProgramKey,
    },
    {
      id: "tv-staf",
      label: "Staf RE (Wisnu, Agung, Jully)",
      count: IYRC_PNL_ASSUMPTIONS.reStaffTravelCount,
      perPerson: travelPerPerson,
      totalIdr: IYRC_PNL_ASSUMPTIONS.reStaffTravelCount * travelPerPerson,
      program: "STAF_RE" as IyrcProgramKey,
    },
    {
      id: "tv-tb",
      label: "Tunas Bangsa",
      count: IYRC_PNL_ASSUMPTIONS.tunasBangsaTravelCount,
      perPerson: travelPerPerson,
      totalIdr: IYRC_PNL_ASSUMPTIONS.tunasBangsaTravelCount * travelPerPerson,
      program: "TUNAS_BANGSA" as IyrcProgramKey,
    },
  ];
  const totalTravel = travelRows.reduce((s, t) => s + t.totalIdr, 0);

  // Bagian 8: Biaya Tambahan Realisasi s.d. 26 Nov 2026
  const additionalRows = IYRC_ADDITIONAL_EXPENSE_ITEMS.map((item) => ({
    ...item,
    computedIdr: item.currency === "USD" ? item.originalAmount * usdToIdr : item.originalAmount,
  }));
  const totalAdditionalRealized = additionalRows.reduce((s, a) => s + a.computedIdr, 0);
  const totalAdditionalWithEquip = totalAdditionalRealized + equipmentPurchaseEstimate;

  const totalExpense =
    totalMyRobotIdr + totalKitPpn + totalHotel + totalTravel + totalAdditionalWithEquip;
  const netProfit = totalRevenue - totalExpense;
  const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Rincian per Program (Bagian 7)
  const addByProgram = (prog: IyrcProgramKey) =>
    additionalRows
      .filter((a) => a.program === prog)
      .reduce((s, a) => s + a.computedIdr, 0);
  const mrByProgram = (prog: IyrcProgramKey) =>
    myRobotRows
      .filter((r) => r.program === prog)
      .reduce((s, r) => s + r.totalIdr, 0);

  const sntRev = 146400000 + 61195360;
  const sntExp =
    mrByProgram("SNT") +
    sntHotelShare +
    IYRC_PNL_ASSUMPTIONS.sntTravelCount * travelPerPerson +
    addByProgram("SNT");

  const grethaRev = 47150000;
  const grethaExp =
    mrByProgram("GRETHA") +
    grethaHotelShare +
    IYRC_PNL_ASSUMPTIONS.grethaTravelCount * travelPerPerson +
    kitGrethaCost +
    addByProgram("GRETHA");

  const tbRev = 73000000 + 6500000;
  const tbExp =
    mrByProgram("TUNAS_BANGSA") +
    IYRC_PNL_ASSUMPTIONS.tunasBangsaTravelCount * travelPerPerson +
    kitTbCost +
    addByProgram("TUNAS_BANGSA");

  const kitSntExp = kitSntCost + ppnKitSnt + addByProgram("KIT_SNT");

  const stafReExp =
    mrByProgram("STAF_RE") +
    IYRC_PNL_ASSUMPTIONS.reStaffTravelCount * travelPerPerson +
    addByProgram("STAF_RE") +
    equipmentPurchaseEstimate;

  const programBreakdown: IyrcProgramSummaryBudget[] = [
    {
      ...IYRC_PROGRAM_BREAKDOWN[0],
      revenueBudget: sntRev,
      expenseBudget: sntExp,
      profitBudget: sntRev - sntExp,
    },
    {
      ...IYRC_PROGRAM_BREAKDOWN[1],
      revenueBudget: grethaRev,
      expenseBudget: grethaExp,
      profitBudget: grethaRev - grethaExp,
    },
    {
      ...IYRC_PROGRAM_BREAKDOWN[2],
      revenueBudget: tbRev,
      expenseBudget: tbExp,
      profitBudget: tbRev - tbExp,
    },
    {
      ...IYRC_PROGRAM_BREAKDOWN[3],
      revenueBudget: kitSntRevenue,
      expenseBudget: kitSntExp,
      profitBudget: kitSntRevenue - kitSntExp,
    },
    {
      ...IYRC_PROGRAM_BREAKDOWN[4],
      revenueBudget: 0,
      expenseBudget: stafReExp,
      profitBudget: -stafReExp,
    },
  ];

  return {
    usdToIdr,
    equipmentPurchaseEstimate,
    totalRevenue,
    myRobotRows,
    totalMyRobotUsd,
    totalMyRobotIdr,
    kitModalPerChild,
    kitSntCost,
    kitGrethaCost,
    kitTbCost,
    ppnKitSnt,
    totalKitPpn,
    hotelRows: IYRC_HOTEL_88_ITEMS,
    totalHotel,
    grethaHotelShare,
    sntHotelShare,
    travelRows,
    totalTravel,
    additionalRows,
    totalAdditionalRealized,
    totalAdditionalWithEquip,
    totalExpense,
    netProfit,
    marginPct,
    programBreakdown,
  };
}


