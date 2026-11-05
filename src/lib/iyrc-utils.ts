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
  preparedBy: { nama: "Galvin Amaris Limbrawan", jabatan: "Program Director Robotic Explorer" },
  approvedBy: { nama: "Jully Tjindrawan, MBA", jabatan: "Koordinator Wilayah 2" },
  usdRate: 18000,
};

/** Paket per orang (untuk ringkasan & simulasi) */
export const IYRC_PACKAGE = {
  pendampingPackage: 12000000, // B.1 per guru pendamping
  categoryFeeUsd: 250,
  categoryCount: 3, // Jurassic Explorer, Sumo, Creative – masing-masing 1 tim
  studyTourPerPerson: 6500000, // F.1 / F.2
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
};

export const JAKARTA_HOTEL_OPTIONS = [
  {
    key: "social-hub",
    nama: "Social Hub by TwoSpaces",
    bintang: 3,
    alamat: "Jl. Sosial No. 52, Kec. Grogol Petamburan, Kota Jakarta Barat, DKI Jakarta 11460",
    tarifDasar: 235700,
    servicePct: 0,
    pajakPct: 0,
    tarifInklusif: true,
    sarapan: "Tidak termasuk (Rp65.000/orang/hari)",
    fasilitas: "46 kamar ber-AC, Wi-Fi gratis, resepsionis 24 jam, restoran/kafe, parkir gratis; tidak ada lift",
    sumber: "Expedia – mulai US$13/malam (±Rp235.700), sudah termasuk pajak & fee",
    catatan: "Termurah, namun beberapa platform mencatat hanya menerima pembayaran tunai – pastikan invoice/kuitansi resmi untuk SPJ.",
  },
  {
    key: "maple",
    nama: "Maple Hotel Grogol",
    bintang: 3,
    alamat: "Jl. Kali Sekretaris Dalam No. 55, RT.5/RW.1, Tj. Duren Utara, Kec. Grogol Petamburan, Jakarta Barat 11470 · Telp. +62 21 2256 1234",
    tarifDasar: 247604,
    servicePct: 10,
    pajakPct: 10,
    tarifInklusif: false,
    sarapan: "Tidak termasuk (opsional, biaya tambahan)",
    fasilitas: "Restoran, bar, Wi-Fi gratis di kamar, brankas kamar, ruang konferensi, parkir gratis; ±6 menit jalan kaki ke Mal Ciputra",
    sumber: "Trivago – mulai Rp247.604/malam, belum termasuk pajak & service",
    catatan: "Selisih ±Rp3,3 jt dari termurah; invoice resmi lebih mudah untuk pertanggungjawaban.",
  },
  {
    key: "mercure",
    nama: "Mercure Jakarta Grogol",
    bintang: 4,
    alamat: "Jl. Daan Mogot No. 50 B, Wijaya Kusuma, Kec. Grogol Petamburan, Kota Jakarta Barat 11460",
    tarifDasar: 523000,
    servicePct: 10,
    pajakPct: 10,
    tarifInklusif: false,
    sarapan: "Tidak termasuk (restoran tersedia, berbayar)",
    fasilitas: "95 kamar & suite; kolam renang outdoor, spa, gym, restoran, 7 ruang rapat, parkir & Wi-Fi gratis",
    sumber: "Trip.com – mulai S$39/malam (±Rp523.000), belum termasuk pajak & service",
    catatan: "Opsi termahal (+Rp20,6 jt dari termurah).",
  },
];

/** Hitung rincian biaya hotel pelatihan Jakarta (service 10% × sewa; PBJT 10% × (sewa + service)) */
export function calculateJakartaHotel(option: (typeof JAKARTA_HOTEL_OPTIONS)[number], nights = JAKARTA_TRAINING_STAY.nights, rooms = JAKARTA_TRAINING_STAY.rooms) {
  const roomNights = nights * rooms;
  const sewa = roomNights * option.tarifDasar;
  const service = Math.round(sewa * (option.servicePct / 100));
  const pajak = Math.round((sewa + service) * (option.pajakPct / 100));
  const total = sewa + service + pajak;
  const perKamarMalam = roomNights > 0 ? total / roomNights : 0;
  return { roomNights, sewa, service, pajak, total, perKamarMalam, perMalamSemuaKamar: perKamarMalam * rooms };
}

/** Ringkasan pelatihan siswa di Jakarta */
export const TRAINING_WEEKS = [
  { pekan: "Pekan 1", tanggal: "16 – 22 Nov", fokus: "Pengenalan CodeSpark 3, perakitan robot line tracing & remote control, latihan misi Jurassic Survival, integrasi awal dua robot (Sesi 1–7)" },
  { pekan: "Pekan 2", tanggal: "23 – 29 Nov", fokus: "Perbaikan & integrasi dua robot Jurassic, riset tema dan penentuan ide Creative Design, mulai bangun prototipe, Simulasi Kompetisi I (Sesi 8–10)" },
  { pekan: "Pekan 3", tanggal: "30 Nov – 6 Des", fokus: "Prototipe & pemrograman Creative Design, naskah presentasi bahasa Inggris, poster & manual, Simulasi Kompetisi II–III, pembekuan program Jurassic (Sesi 11–16)" },
  { pekan: "Pekan 4", tanggal: "7 – 9 Des", fokus: "Final check, packing kit untuk perjalanan udara, briefing keberangkatan, cek alat Creative dan presentasi latihan (Sesi 17–19)" },
];

/** Rencana pengurusan visa */
export const VISA_TIMELINE = [
  { waktu: "4 Nov", kegiatan: "Invitation letter dari IYRA & My Robot Time (SZ) Co., Ltd. sudah diterima (lampiran Appendix A daftar peserta); diteruskan ke Direktorat sebagai dasar izin Perjalanan Dinas LN (Direktur ST → Sekjen → Setneg). Appendix A sedang diperbarui karena pergantian guru pendamping SNT 5 Tidore Kepulauan (Bapak Farid A. M).", pj: "Robotic Explorer → Direktorat" },
  { waktu: "4–13 Nov", kegiatan: "Pengumpulan scan paspor, pas foto, dan dokumen pendukung visa peserta", pj: "Robotic Explorer & SNT" },
  { waktu: "Segera", kegiatan: "Pengurusan paspor bagi yang belum memiliki (biaya paspor & asuransi ditanggung kota/daerah masing-masing)", pj: "Kota/daerah masing-masing" },
  { waktu: "16–20 Nov", kegiatan: "Pengajuan visa di Chinese Visa Application Service Center Jakarta (invitation letter, booking tiket & hotel). Siswa sudah di Jakarta sejak 15 Nov untuk rekam sidik jari; guru pendamping mengatur jadwal masing-masing.", pj: "Peserta/SNT" },
  { waktu: "s.d. ±27 Nov", kegiatan: "Visa terbit (proses reguler ±4 hari kerja setelah pengajuan)", pj: "–" },
  { waktu: "s.d. 11 Des", kegiatan: "Waktu cadangan bila ada dokumen tambahan atau proses lebih lama", pj: "–" },
];

export const VISA_DOCUMENTS = [
  "Paspor asli (masa berlaku minimal 6 bulan) dan pas foto sesuai ketentuan",
  "Invitation letter dari panitia IYRC (sudah diterima 4 Nov)",
  "Bukti booking tiket pesawat pulang-pergi dan booking hotel",
  "Siswa di bawah 18 tahun: akta kelahiran, Kartu Keluarga, dan surat izin orang tua",
  "Pemohon usia 14 tahun ke atas umumnya wajib hadir untuk rekam sidik jari",
];

/** Itinerary utama (tanpa study tour) */
export const MAIN_ITINERARY = [
  { tanggal: "Minggu, 15 Nov", kegiatan: "Siswa terbang dari daerah asal ke Jakarta", menginap: "Akomodasi pelatihan siswa (dibiayai)" },
  { tanggal: "16 Nov – 9 Des", kegiatan: "Pelatihan intensif di Robotic Explorer, Jakarta: 19 sesi bersama pelatih (@ 4 jam) diselingi latihan mandiri", menginap: "Akomodasi pelatihan siswa (dibiayai)" },
  { tanggal: "Kamis, 10 Des", kegiatan: "Guru pendamping tiba di Jakarta; persiapan akhir keberangkatan", menginap: "Siswa: akomodasi pelatihan · Pendamping: tidak dibiayai" },
  { tanggal: "Jumat, 11 Des", kegiatan: "05.30 kumpul di CGK Terminal 3 · 09.05 terbang CZ8056 · 15.25 tiba di Shenzhen · transfer ke hotel · check-in & registrasi peserta", menginap: "Zhongbao International Hotel" },
  { tanggal: "Sabtu, 12 Des", kegiatan: "Hari kompetisi 1 di Longgang International Arts Center", menginap: "Zhongbao International Hotel" },
  { tanggal: "Minggu, 13 Des", kegiatan: "Hari kompetisi 2", menginap: "Zhongbao International Hotel" },
  { tanggal: "Senin, 14 Des", kegiatan: "Check-out hotel · transfer ke Bandara Shenzhen Bao'an · 19.05 terbang CZ8353 · 23.20 tiba di Jakarta · menunggu penerbangan lanjutan subuh di bandara", menginap: "– (transit di bandara)" },
  { tanggal: "Selasa, 15 Des", kegiatan: "Subuh: terbang dari Jakarta langsung ke daerah asal masing-masing", menginap: "–" },
];

/** Itinerary opsi study tour (14–16 Des) */
export const STUDY_TOUR_ITINERARY = [
  { tanggal: "Senin, 14 Des", kegiatan: "Check-out hotel paket kompetisi · program study tour & pertukaran edukasi", menginap: "Sesuai program study tour" },
  { tanggal: "Selasa, 15 Des", kegiatan: "Program study tour & pertukaran edukasi", menginap: "Sesuai program study tour" },
  { tanggal: "Rabu, 16 Des", kegiatan: "Program berakhir · transfer ke Bandara Guangzhou Baiyun (CAN) · terbang ke Jakarta [nomor & jam penerbangan menyusul]", menginap: "–" },
  { tanggal: "Kamis, 17 Des", kegiatan: "Lanjut terbang dari Jakarta ke daerah asal masing-masing", menginap: "–" },
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
