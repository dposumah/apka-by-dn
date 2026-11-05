"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import {
  Globe,
  Users,
  Calendar,
  FileText,
  Share2,
  Calculator,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Plane,
  Hotel,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building,
  FileDown,
  User,
  X,
  GraduationCap,
  RefreshCw,
  Landmark,
} from "lucide-react";
import {
  addIyrcParticipant,
  updateIyrcParticipant,
  deleteIyrcParticipant,
  syncRabToDatabase,
  resetIyrcToDefault,
  syncIyrcToLatestData,
} from "@/actions/iyrc";
import {
  calculateDynamicRab,
  calculateJakartaHotel,
  terbilang,
  IYRC_INFO,
  IYRC_DATA_VERSION,
  JAKARTA_HOTEL_OPTIONS,
  JAKARTA_TRAINING_STAY,
  TRAINING_WEEKS,
  VISA_TIMELINE,
  VISA_DOCUMENTS,
  MAIN_ITINERARY,
  STUDY_TOUR_ITINERARY,
} from "@/lib/iyrc-utils";

export default function IyrcClientPage({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState<"rab" | "kontingen" | "pelatihan" | "itinerary" | "invitation" | "whatsapp">("rab");

  // State Peserta & Budget Items
  const [participants, setParticipants] = useState<any[]>(initialData.participants || []);
  const [budgetItems, setBudgetItems] = useState<any[]>(initialData.budgetItems || []);

  // State Simulasi Dinamis
  const actualSiswaCount = useMemo(() => participants.filter((p) => p.peran === "SISWA").length, [participants]);
  const actualPendampingCount = useMemo(() => participants.filter((p) => p.peran === "GURU_PENDAMPING").length, [participants]);

  const [simSiswa, setSimSiswa] = useState<number>(actualSiswaCount);
  const [simPendamping, setSimPendamping] = useState<number>(actualPendampingCount);
  const [isApplyingSim, setIsApplyingSim] = useState(false);
  const [studyTour, setStudyTour] = useState<boolean>(false);

  // Kalkulasi Simulasi RAB (Real-time)
  const currentSimulation = useMemo(() => {
    return calculateDynamicRab(simSiswa, simPendamping, budgetItems, { studyTour });
  }, [simSiswa, simPendamping, budgetItems, studyTour]);

  // Perbandingan hotel pelatihan Jakarta
  const jakartaHotelComparison = useMemo(() => {
    const rows = JAKARTA_HOTEL_OPTIONS.map((h) => ({ ...h, calc: calculateJakartaHotel(h) }));
    const sorted = [...rows].sort((a, b) => a.calc.total - b.calc.total);
    return rows.map((r) => ({ ...r, peringkat: sorted.findIndex((s) => s.key === r.key) + 1 }));
  }, []);

  // Modal State untuk Peserta
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newParticipant, setNewParticipant] = useState({
    nama: "",
    peran: "SISWA" as "SISWA" | "GURU_PENDAMPING",
    sntAsal: "SNT 10 Kupang",
    sekolahAsal: "",
    nisnOrNip: "",
    nomorPaspor: "",
    catatan: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    nama: "",
    sntAsal: "",
    sekolahAsal: "",
    nisnOrNip: "",
    nomorPaspor: "",
    statusPembayaran: "BELUM_LUNAS" as "BELUM_LUNAS" | "CICILAN" | "LUNAS",
    nominalTerbayar: 0,
    catatan: "",
  });

  // Invitation Letter Generator State (Dibuat Per Siswa/Individu)
  const [letterLanguage, setLetterLanguage] = useState<"id" | "en">("id");
  const [selectedLetterParticipant, setSelectedLetterParticipant] = useState<string>(
    initialData.participants?.[0]?.id || ""
  );
  const [letterRecipient, setLetterRecipient] = useState<string>(
    initialData.participants?.[0] ? `Kepala ${initialData.participants[0].sntAsal}` : "Kepala SNT"
  );
  const [letterNumber, setLetterNumber] = useState<string>("088/RE-IYRC/XI/2026");
  const [letterDate, setLetterDate] = useState<string>("5 November 2026");
  const [showItineraryPrintModal, setShowItineraryPrintModal] = useState<boolean>(false);
  const [showLetterPrintModal, setShowLetterPrintModal] = useState<boolean>(false);
  const [selectedDocs, setSelectedDocs] = useState<{ id: boolean; en: boolean; itinerary: boolean }>({
    id: true,
    en: true,
    itinerary: true,
  });
  const selectedDocsCount =
    (selectedDocs.id ? 1 : 0) + (selectedDocs.en ? 1 : 0) + (selectedDocs.itinerary ? 1 : 0);

  // Penandatangan Dinamis: Default Koordinator Wilayah 2 (Jully Tjindrawan) di sebelah KANAN
  const [signatories, setSignatories] = useState<Array<{ nama: string; jabatan: string; instansi: string }>>([
    {
      nama: "Jully Tjindrawan, MBA",
      jabatan: "Koordinator Wilayah 2 Program SNT",
      instansi: "PT Jully Tjindrawan Robotik (Robotic Explorer)",
    },
  ]);

  // Render Tanda Tangan Reusable (Utama di KANAN, Tambahan di KIRI)
  const renderSignatures = () => {
    if (signatories.length === 1) {
      return (
        <div className="pt-8 flex justify-end">
          <div className="text-center w-64 space-y-16">
            <p className="text-slate-600 font-semibold text-xs">{signatories[0].instansi}</p>
            <div>
              <p className="font-extrabold text-slate-900 underline text-sm">{signatories[0].nama}</p>
              <p className="text-slate-500 font-medium text-[11px]">{signatories[0].jabatan}</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="pt-8 flex justify-between items-start">
        {/* Tanda tangan tambahan (index 1 ke atas) di sebelah KIRI */}
        <div className="flex gap-8">
          {signatories.slice(1).map((sig, idx) => (
            <div key={idx} className="text-center w-56 space-y-16">
              <p className="text-slate-600 font-semibold text-xs">{sig.instansi}</p>
              <div>
                <p className="font-extrabold text-slate-900 underline text-sm">{sig.nama}</p>
                <p className="text-slate-500 font-medium text-[11px]">{sig.jabatan}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tanda tangan utama (Jully Tjindrawan) di sebelah KANAN */}
        <div className="text-center w-64 space-y-16">
          <p className="text-slate-600 font-semibold text-xs">{signatories[0].instansi}</p>
          <div>
            <p className="font-extrabold text-slate-900 underline text-sm">{signatories[0].nama}</p>
            <p className="text-slate-500 font-medium text-[11px]">{signatories[0].jabatan}</p>
          </div>
        </div>
      </div>
    );
  };

  // Sync tujuan surat otomatis dengan asal SNT peserta yang dipilih
  useEffect(() => {
    const p = participants.find((item) => item.id === selectedLetterParticipant);
    if (p) {
      setLetterRecipient(`Kepala ${p.sntAsal}`);
    }
  }, [selectedLetterParticipant, participants]);

  // Handler Print Khusus (Surat Tunggal, Itinerary, atau Paket Lengkap 3 Dokumen Sekaligus)
  const handlePrint = (target: "letter" | "itinerary" | "bundle") => {
    document.body.setAttribute("data-print-target", target);
    window.print();
    setTimeout(() => {
      document.body.removeAttribute("data-print-target");
    }, 1200);
  };

  const handlePrintLetter = () => handlePrint("letter");
  const handlePrintItinerary = () => handlePrint("itinerary");

  // Handler Terapkan Simulasi ke Database
  const handleApplySimulation = async () => {
    if (!confirm(`Terapkan simulasi ${simSiswa} Siswa & ${simPendamping} Pendamping ke database resmi?`)) return;
    setIsApplyingSim(true);
    try {
      const res = await syncRabToDatabase(simSiswa, simPendamping);
      if (res?.error) throw new Error(res.error);
      alert("Simulasi berhasil diterapkan ke anggaran database!");
      window.location.reload();
    } catch (err: any) {
      alert("Gagal menerapkan simulasi: " + err.message);
    } finally {
      setIsApplyingSim(false);
    }
  };

  // Handler Reset Default PDF
  const handleResetDefault = async () => {
    if (!confirm("Reset TOTAL data peserta dan RAB ke dokumen terbaru (4 Siswa & 2 Guru Pendamping, versi 5 Nov 2026)?\n\nPERHATIAN: status pembayaran & nomor paspor yang sudah diisi akan terhapus. Gunakan 'Sinkron Data 5 Nov' bila ingin mempertahankannya.")) return;
    setIsSubmitting(true);
    try {
      await resetIyrcToDefault();
      alert("Data berhasil direset ke dokumen terbaru!");
      window.location.reload();
    } catch (err: any) {
      alert("Gagal mereset: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Sinkron ke Data Terbaru (mempertahankan pembayaran)
  const handleSyncLatest = async () => {
    if (!confirm(`Sinkronkan RAB & peserta ke dokumen terbaru (${IYRC_DATA_VERSION})?\n\n• Item RAB diganti sesuai PDF (A.1–A.5, B.1, C–E)\n• Siswa ke-4 (SNT 15 Buton Tengah) & Bapak Farid A. M ditambahkan\n• Status pembayaran, paspor & catatan yang sudah diisi TETAP dipertahankan`)) return;
    setIsSubmitting(true);
    try {
      const res: any = await syncIyrcToLatestData();
      if (res?.error) throw new Error(res.error);
      let msg = `Sinkronisasi berhasil: ${res.countSiswa} siswa & ${res.countPendamping} pendamping.`;
      if (res.keptReplaced?.length) {
        msg += `\n\nCatatan: ${res.keptReplaced.join(", ")} tidak dihapus karena sudah memiliki pembayaran. Silakan hapus manual bila perlu.`;
      }
      alert(msg);
      window.location.reload();
    } catch (err: any) {
      alert("Gagal sinkronisasi: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Tambah Peserta
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant.nama.trim()) return alert("Nama peserta wajib diisi");
    setIsSubmitting(true);
    try {
      const res = await addIyrcParticipant(newParticipant);
      if (res?.error) throw new Error(res.error);
      setShowAddModal(false);
      setNewParticipant({
        nama: "",
        peran: "SISWA",
        sntAsal: "SNT 10 Kupang",
        sekolahAsal: "",
        nisnOrNip: "",
        nomorPaspor: "",
        catatan: "",
      });
      window.location.reload();
    } catch (err: any) {
      alert("Gagal menambah peserta: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Hapus Peserta
  const handleDeleteParticipant = async (id: string, nama: string) => {
    if (!confirm(`Hapus peserta ${nama}? Anggaran RAB akan otomatis disesuaikan.`)) return;
    try {
      await deleteIyrcParticipant(id);
      window.location.reload();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // Handler Simpan Identitas & Status Pembayaran Peserta
  const handleSavePayment = async () => {
    if (!selectedParticipant) return;
    if (!paymentForm.nama.trim()) return alert("Nama peserta tidak boleh kosong");
    setIsSubmitting(true);
    try {
      await updateIyrcParticipant(selectedParticipant.id, {
        nama: paymentForm.nama.trim(),
        sntAsal: paymentForm.sntAsal.trim(),
        sekolahAsal: paymentForm.sekolahAsal.trim(),
        nisnOrNip: paymentForm.nisnOrNip.trim(),
        nomorPaspor: paymentForm.nomorPaspor.trim(),
        statusPembayaran: paymentForm.statusPembayaran,
        nominalTerbayar: Number(paymentForm.nominalTerbayar) || 0,
        catatan: paymentForm.catatan,
      });
      setShowEditPaymentModal(false);
      window.location.reload();
    } catch (err: any) {
      alert("Gagal memperbarui data peserta: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Export CSV RAB
  const handleExportCsv = () => {
    const headers = ["Kode", "Kategori", "Uraian", "Volume", "Satuan", "Harga Satuan", "Rincian I (Robotic Explorer)", "Rincian II (Kemendikdasmen)", "Keterangan"];
    const rows = currentSimulation.items.map((item: any) => [
      item.code,
      item.namaKategori.replace(/,/g, " "),
      item.uraian.replace(/,/g, " "),
      item.volume,
      item.satuan,
      item.hargaSatuan,
      item.tanggunganRobotic,
      item.tanggunganPeserta,
      (item.keterangan || "").replace(/,/g, " "),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RAB_IYRC_China_2026_${simSiswa}Siswa_${simPendamping}Pendamping.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Teks WhatsApp Resmi (Versi 5 November 2026)
  const whatsappText = `Yth. Bapak/Ibu Guru Pendamping & Orang Tua Siswa SNT,

Berikut kami sampaikan pembaruan resmi rincian informasi dan jadwal keikutsertaan kontingen SNT Wilayah 2 pada *The 14th IYRC International Youth Robotics and AI Competition 2026 (Shenzhen, China)* (Versi 5 November 2026):

🎓 *1. PELATIHAN INTENSIF SISWA DI JAKARTA*
• *Periode:* Minggu, 15 November – Rabu, 9 Desember 2026 (4 pekan · 19 sesi @ 4 jam)
• *Lokasi:* Robotic Explorer Center, Greenville Blok AL No. 1A–B, Jakarta Barat
• *Akomodasi Siswa:* Hotel area Grogol/Jakarta Barat (Check-in Minggu, 15 Nov – Check-out Jumat, 11 Des 2026 · 26 malam / 2 kamar Twin, ditanggung Robotic Explorer).
• *Catatan:* Guru pendamping & pendamping kementerian tiba di Jakarta pada *Kamis, 10 Desember 2026*.

📍 *2. JADWAL PENERBANGAN INTERNASIONAL (CHINA SOUTHERN)*
• *Keberangkatan:* Jumat, 11 Desember 2026
  China Southern Airlines *CZ8056* (Airbus A320neo)
  Rute: Jakarta (CGK T3) *09.05 WIB* → Shenzhen (SZX T3) *15.25 CST*
• *Kepulangan (Tanpa Study Tour):* Senin, 14 Desember 2026
  China Southern Airlines *CZ8353* (Airbus A321neo)
  Rute: Shenzhen (SZX T3) *19.05 CST* → Jakarta (CGK T3) *23.20 WIB*
  *(Lanjut penerbangan domestik subuh Selasa, 15 Des 2026 ke daerah asal)*
• *Opsi Tambahan Study Tour (14–16 Des):* Bila memilih opsi Study Tour (+Rp6.500.000/orang), kepulangan pada *Rabu, 16 Desember 2026* melalui Bandara Guangzhou Baiyun (CAN).

🏨 *3. HOTEL RESMI DI SHENZHEN (11–14 DES 2026)*
• *Zhongbao International Hotel (深圳中保国际酒店)*
• *Alamat:* No. 21 Donghuan 2nd Road, Longhua District, Shenzhen (±15 km / 25–30 menit ke venue Longgang International Arts Center).
• Sudah termasuk sarapan, makan siang, makan malam & bus shuttle selama kompetisi (3 malam).

🗓️ *4. RINGKASAN ITINERARY KOMPETISI*
• *10 Des (Kam):* Guru pendamping terbang dari daerah asal ke Jakarta; pengumpulan akhir paspor & visa.
• *11 Des (Jum):* Penerbangan CGK → SZX (CZ8056), check-in Zhongbao International Hotel & registrasi peserta.
• *12 Des (Sab):* Opening Ceremony & Kompetisi Hari Pertama (Jurassic Explorer, Sumo, Creative).
• *13 Des (Min):* Kompetisi Hari Kedua, Final Creative, Awarding & Closing Ceremony.
• *14 Des (Sen):* Check-out hotel (12.00 CST), transfer ke Bandara SZX, penerbangan CZ8353 pukul 19.05 CST → tiba CGK 23.20 WIB.
• *15 Des (Sel):* Penerbangan domestik subuh kembali ke daerah asal masing-masing.

📑 *5. TIMELINE PENGURUSAN VISA CHINA (CVASC JAKARTA)*
• *Batas Paspor & Dokumen Digital:* Selasa, 10 Nov 2026
• *Pengisian Form COVA Online:* 11–13 Nov 2026
• *Submit Berkas Fisik & Biometrik CVASC Jakarta:* *16–20 Nov 2026* (dilakukan saat siswa sudah berada di Jakarta untuk pelatihan)
• *Estimasi Visa Terbit:* 27 Nov – 2 Des 2026

✉️ *6. SURAT UNDANGAN RESMI (INVITATION LETTER)*
Surat undangan resmi berkop PT Jully Tjindrawan Robotik (Robotic Explorer) untuk masing-masing peserta telah disiapkan sebagai dasar permohonan *Izin Perjalanan Dinas Luar Negeri*.

Demikian kami sampaikan. Terima kasih atas kerja sama dan dukungan Bapak/Ibu! 🙏🤖`;

  // Salin Pesan WhatsApp
  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      alert("Teks balasan WhatsApp berhasil disalin ke clipboard!");
    } catch {
      alert("Gagal menyalin teks.");
    }
  };

  // Peserta individu yang dipilih untuk Invitation Letter (1 Siswa/Guru per Surat)
  const currentLetterParticipant = useMemo(() => {
    return participants.find((p) => p.id === selectedLetterParticipant) || participants[0] || null;
  }, [participants, selectedLetterParticipant]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="no-print bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Globe size={260} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-indigo-200">
                <Sparkles size={13} className="text-amber-300" /> The 14th International Youth Robotics and AI Competition
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-[11px] font-bold text-amber-200">
                Dokumen Resmi: {IYRC_DATA_VERSION}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              IYRC China 2026 – Shenzhen (SNT Wilayah 2)
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Longgang International Arts Center, Shenzhen · Kompetisi 12–13 Des 2026 · 4 Siswa (2 SMP & 2 SMA) + 2 Guru Pendamping
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncLatest}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              title="Sinkronkan database ke dokumen terbaru 5 Nov 2026 tanpa menghapus pembayaran"
            >
              <RefreshCw size={15} /> Sinkron Data 5 Nov
            </button>
            <button
              onClick={handleCopyWhatsApp}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Share2 size={15} /> Salin Format WA
            </button>
            <button
              onClick={handleExportCsv}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              onClick={handleResetDefault}
              disabled={isSubmitting}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              title="Reset penuh ke default 4 siswa & 2 guru (5 Nov 2026)"
            >
              <RotateCcw size={14} /> Reset Default
            </button>
          </div>
        </div>

        {/* Quick Tabs Menu */}
        <div className="flex overflow-x-auto gap-2 pt-6 mt-6 border-t border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("rab")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "rab" ? "bg-white text-indigo-900 shadow-md font-bold" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Calculator size={15} /> RAB & Simulasi Dinamis
          </button>
          <button
            onClick={() => setActiveTab("kontingen")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "kontingen" ? "bg-white text-indigo-900 shadow-md font-bold" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Users size={15} /> Kontingen & Peserta ({participants.length})
          </button>
          <button
            onClick={() => setActiveTab("pelatihan")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "pelatihan" ? "bg-white text-indigo-900 shadow-md font-bold" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Hotel size={15} /> Pelatihan & Hotel Jakarta (3 Opsi)
          </button>
          <button
            onClick={() => setActiveTab("itinerary")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "itinerary" ? "bg-white text-indigo-900 shadow-md font-bold" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Calendar size={15} /> Itinerary, Penerbangan & Visa
          </button>
          <button
            onClick={() => setActiveTab("invitation")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "invitation" ? "bg-white text-indigo-900 shadow-md font-bold" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <FileText size={15} /> Invitation Letter & Izin Dinas
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "whatsapp" ? "bg-white text-indigo-900 shadow-md font-bold" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Share2 size={15} /> Balasan WhatsApp (1-Klik)
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: RAB & SIMULASI DINAMIS ==================== */}
      {activeTab === "rab" && (
        <div className="space-y-6">
          {/* SIMULATION CONTROLLER CARD */}
          <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-indigo-700 font-bold text-sm">
                <Calculator size={18} />
                <span>Panel Simulasi Dinamis Peserta, Pendamping & Opsi Study Tour</span>
                {(simSiswa !== actualSiswaCount || simPendamping !== actualPendampingCount || studyTour) && (
                  <span className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                    Mode Simulasi Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Ubah jumlah siswa, pendamping, atau aktifkan toggle <strong>Opsi Study Tour (14–16 Des)</strong> untuk melihat kalkulasi otomatis Rincian I & II.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              {/* Counter Siswa */}
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-slate-700">Siswa:</span>
                <button
                  onClick={() => setSimSiswa(Math.max(1, simSiswa - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition-colors shadow-sm"
                >
                  -
                </button>
                <span className="w-6 text-center font-extrabold text-sm text-indigo-700">{simSiswa}</span>
                <button
                  onClick={() => setSimSiswa(simSiswa + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition-colors shadow-sm"
                >
                  +
                </button>
              </div>

              {/* Counter Pendamping */}
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-slate-700">Pendamping:</span>
                <button
                  onClick={() => setSimPendamping(Math.max(1, simPendamping - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition-colors shadow-sm"
                >
                  -
                </button>
                <span className="w-6 text-center font-extrabold text-sm text-violet-700">{simPendamping}</span>
                <button
                  onClick={() => setSimPendamping(simPendamping + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition-colors shadow-sm"
                >
                  +
                </button>
              </div>

              {/* Toggle Study Tour 14-16 Des */}
              <label
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border cursor-pointer transition-all select-none ${
                  studyTour
                    ? "bg-amber-50 border-amber-400 text-amber-900 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={studyTour}
                  onChange={(e) => setStudyTour(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="font-extrabold block leading-tight">Opsi Study Tour (14–16 Des)</span>
                  <span className="text-[10px] text-slate-500">+Rp6.500.000/orang (Pulang 16 Des via CAN)</span>
                </div>
              </label>

              {/* Action Buttons */}
              <button
                onClick={handleApplySimulation}
                disabled={isApplyingSim || (simSiswa === actualSiswaCount && simPendamping === actualPendampingCount)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} /> Simpan Simulasi ke RAB
              </button>

              {(simSiswa !== actualSiswaCount || simPendamping !== actualPendampingCount || studyTour) && (
                <button
                  onClick={() => {
                    setSimSiswa(actualSiswaCount);
                    setSimPendamping(actualPendampingCount);
                    setStudyTour(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Reset Simulasi
                </button>
              )}
            </div>
          </div>

          {/* 4 SUMMARY STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-indigo-600 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                  Rincian I · Transfer ke Robotic Explorer
                  <Building size={16} className="text-indigo-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-indigo-700">
                  {formatCurrency(currentSimulation.totalTransferRobotic)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {studyTour
                    ? `Termasuk Add-on Study Tour +${formatCurrency(currentSimulation.subtotalStudyTour)}`
                    : `Paket Kompetisi (${simSiswa} Siswa + ${simPendamping} Pendamping) · Tanpa Study Tour`}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                  Rincian II · Estimasi Kemendikdasmen
                  <Users size={16} className="text-rose-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-rose-600">
                  {formatCurrency(currentSimulation.totalTanggunganPeserta)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tiket Domestik, CZ8056/CZ8353 & Visa ({currentSimulation.totalPersonel} Orang · Tidak Ditransfer)
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                  Estimasi Total Per Siswa
                  <Sparkles size={16} className="text-emerald-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-emerald-700">
                  {formatCurrency(currentSimulation.biayaPerSiswa)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kompetisi {formatCurrency(currentSimulation.biayaKompetisiPerSiswa)} + Perjalanan {formatCurrency(currentSimulation.perPersonTravelFee)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-violet-600 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                  Estimasi Total Per Pendamping
                  <Users size={16} className="text-violet-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-violet-700">
                  {formatCurrency(currentSimulation.biayaPerPendamping)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Paket {formatCurrency(currentSimulation.biayaKompetisiPerPendamping)} + Perjalanan {formatCurrency(currentSimulation.perPersonTravelFee)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* REKENING TRANSFER & PERBANDINGAN STUDY TOUR + POS AKOMODASI PELATIHAN JAKARTA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Rekening Transfer & Perbandingan Opsi Study Tour */}
            <Card className="lg:col-span-7 border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-white shadow-sm">
              <CardHeader className="pb-3 border-b border-indigo-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                    <Landmark size={17} className="text-indigo-600" /> Informasi Rekening Transfer (Rincian I – Biaya Kompetisi)
                  </CardTitle>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rekening resmi pembayaran Biaya Kompetisi kepada penyelenggara / Koordinator Wilayah 2
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                  {IYRC_INFO.bankTransfer.bank} · {IYRC_INFO.bankTransfer.accountNumber}
                </span>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold">Transfer ke Rekening {IYRC_INFO.bankTransfer.bank}:</div>
                    <div className="text-base font-black text-slate-900 tracking-wide">
                      {IYRC_INFO.bankTransfer.accountNumber} <span className="font-bold text-indigo-700">a.n. {IYRC_INFO.bankTransfer.accountHolder}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 italic mt-0.5">
                      Terbilang: {terbilang(currentSimulation.totalTransferRobotic)}
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase text-indigo-600 block">Nominal Transfer Aktif</span>
                    <span className="text-lg font-black text-indigo-700">{formatCurrency(currentSimulation.totalTransferRobotic)}</span>
                  </div>
                </div>

                {/* Tabel Ringkas Tanpa vs Dengan Study Tour */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2 text-left">Komponen Simulasi ({simSiswa} Siswa + {simPendamping} Guru)</th>
                        <th className={`p-2 text-right ${!studyTour ? "bg-indigo-100/80 text-indigo-950" : ""}`}>
                          Tanpa Study Tour (11–14 Des)
                        </th>
                        <th className={`p-2 text-right ${studyTour ? "bg-amber-100/80 text-amber-950" : ""}`}>
                          Dengan Study Tour (11–16 Des)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr>
                        <td className="p-2 font-semibold text-slate-700">Total Ditransfer ke Robotic Explorer (Rincian I)</td>
                        <td className={`p-2 text-right font-bold ${!studyTour ? "bg-indigo-50/50 text-indigo-800" : "text-slate-700"}`}>
                          {formatCurrency(currentSimulation.totalTanggunganRobotic)}
                        </td>
                        <td className={`p-2 text-right font-bold ${studyTour ? "bg-amber-50/60 text-amber-900" : "text-slate-700"}`}>
                          {formatCurrency(currentSimulation.totalTanggunganRobotic + (simSiswa + simPendamping) * IYRC_PACKAGE.studyTourAddOn)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-600">Estimasi Perjalanan & Dokumen (Rincian II – Kemendikdasmen)</td>
                        <td className="p-2 text-right text-slate-600">{formatCurrency(currentSimulation.totalTanggunganPeserta)}</td>
                        <td className="p-2 text-right text-slate-600">{formatCurrency(currentSimulation.totalTanggunganPeserta)}</td>
                      </tr>
                      <tr className="bg-slate-50 font-extrabold text-slate-900">
                        <td className="p-2">Total Kebutuhan Anggaran (I + II)</td>
                        <td className={`p-2 text-right ${!studyTour ? "text-indigo-700" : ""}`}>
                          {formatCurrency(currentSimulation.totalTanggunganRobotic + currentSimulation.totalTanggunganPeserta)}
                        </td>
                        <td className={`p-2 text-right ${studyTour ? "text-amber-800" : ""}`}>
                          {formatCurrency(currentSimulation.totalTanggunganRobotic + (simSiswa + simPendamping) * IYRC_PACKAGE.studyTourAddOn + currentSimulation.totalTanggunganPeserta)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pos Terpisah: Akomodasi Pelatihan Siswa di Jakarta */}
            <Card className="lg:col-span-5 border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-white shadow-sm">
              <CardHeader className="pb-3 border-b border-emerald-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                    <Hotel size={17} className="text-emerald-600" /> Pos Terpisah: Akomodasi Pelatihan Jakarta
                  </CardTitle>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tanggungan Robotic Explorer · 2 Kamar Twin × 26 Malam ({JAKARTA_TRAINING_STAY.checkIn} – {JAKARTA_TRAINING_STAY.checkOut})
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Perbandingan (Belum Dipilih)
                </span>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5 text-xs">
                {jakartaHotelComparison.map((h) => (
                  <div
                    key={h.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      h.rekomendasi
                        ? "bg-emerald-50/70 border-emerald-300"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Opsi {h.opsi}: {h.nama} ({h.bintang}★)</span>
                        {h.rekomendasi && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                            Hemat
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {h.jarakKeVenue} ke Greenville · {formatCurrency(h.tarifDasarMalam)}/malam (+21% pajak/service)
                      </div>
                    </div>
                    <div className="text-right font-extrabold text-slate-900 whitespace-nowrap pl-2">
                      {formatCurrency(h.totalBiaya)}
                      <span className="block text-[10px] font-normal text-slate-500">
                        {formatCurrency(h.perSiswa)}/siswa
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Periode digeser 1 hari (15 Nov–11 Des) agar malam H-1 terbang ter-cover.</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pelatihan")}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline shrink-0 ml-2"
                  >
                    Lihat Detail &rarr;
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DETAIL RAB TABLE */}
          <Card className="shadow-sm overflow-hidden border border-slate-200">
            <CardHeader className="border-b bg-slate-50/70 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Rincian Anggaran Biaya (RAB) Lengkap – Rincian I (Bagian A & B) & Rincian II (Bagian C, D, E)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Komposisi: {simSiswa} Siswa (Paket A · 3 Kategori Lomba) + {simPendamping} Guru Pendamping {studyTour ? "· Termasuk Opsi Study Tour (14–16 Des)" : "· Tanpa Study Tour (11–14 Des)"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Estimasi Kebutuhan (I + II):</span>
                <div className="text-lg font-black text-slate-900">
                  {formatCurrency(currentSimulation.totalKeseluruhan)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left w-12">Kode</th>
                      <th className="px-4 py-3 text-left">Uraian Komponen Biaya</th>
                      <th className="px-4 py-3 text-center">Vol</th>
                      <th className="px-4 py-3 text-center">Satuan</th>
                      <th className="px-4 py-3 text-right">Harga Satuan</th>
                      <th className="px-4 py-3 text-right bg-indigo-50/60 text-indigo-900">Rincian I · Transfer ke Robotic Explorer</th>
                      <th className="px-4 py-3 text-right bg-rose-50/60 text-rose-900">Rincian II · Disiapkan Kemendikdasmen</th>
                      <th className="px-4 py-3 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentSimulation.items.map((item: any, idx: number) => {
                      const isFirstOfCategory = idx === 0 || item.kategori !== currentSimulation.items[idx - 1].kategori;
                      const isRincianI = item.kategori === "A" || item.kategori === "B";
                      return (
                        <tr key={item.code} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{item.code}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.uraian}
                            {isFirstOfCategory && (
                              <span
                                className={`block text-[10px] uppercase font-bold mt-0.5 ${
                                  isRincianI ? "text-indigo-600" : "text-rose-600"
                                }`}
                              >
                                {isRincianI ? "Rincian I" : "Rincian II"} · Bagian {item.kategori} — {item.namaKategori}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">{item.volume}</td>
                          <td className="px-4 py-3 text-center text-xs text-slate-500">{item.satuan}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {formatCurrency(item.hargaSatuan)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-700 bg-indigo-50/20 whitespace-nowrap">
                            {item.tanggunganRobotic > 0 ? formatCurrency(item.tanggunganRobotic) : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-rose-600 bg-rose-50/20 whitespace-nowrap">
                            {item.tanggunganPeserta > 0 ? formatCurrency(item.tanggunganPeserta) : item.hargaSatuan === 0 && !isRincianI ? "Rp 0" : "-"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">{item.keterangan || "-"}</td>
                        </tr>
                      );
                    })}

                    {/* Baris Opsi Study Tour bila diaktifkan */}
                    {studyTour && (
                      <>
                        <tr className="bg-amber-50/50 hover:bg-amber-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-amber-900 whitespace-nowrap">F.1</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            Add-on Study Tour Siswa (14–16 Des 2026)
                            <span className="block text-[10px] uppercase font-bold text-amber-700 mt-0.5">
                              Opsi Tambahan · Hotel, makan, bus & tiket wisata (kembali 16 Des via Guangzhou CAN)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">{simSiswa}</td>
                          <td className="px-4 py-3 text-center text-xs text-slate-500">siswa</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {formatCurrency(IYRC_PACKAGE.studyTourAddOn)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-amber-800 bg-amber-100/50 whitespace-nowrap">
                            {formatCurrency(simSiswa * IYRC_PACKAGE.studyTourAddOn)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">-</td>
                          <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">
                            Opsi Study Tour 2 hari tambahan setelah kompetisi
                          </td>
                        </tr>
                        <tr className="bg-amber-50/50 hover:bg-amber-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-amber-900 whitespace-nowrap">F.2</td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            Add-on Study Tour Guru Pendamping (14–16 Des 2026)
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">{simPendamping}</td>
                          <td className="px-4 py-3 text-center text-xs text-slate-500">orang</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {formatCurrency(IYRC_PACKAGE.studyTourAddOn)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-amber-800 bg-amber-100/50 whitespace-nowrap">
                            {formatCurrency(simPendamping * IYRC_PACKAGE.studyTourAddOn)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">-</td>
                          <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">
                            Opsi Study Tour guru pendamping
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-extrabold text-slate-900 text-sm">
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-right uppercase tracking-wider">
                        Total Anggaran {studyTour ? "(Dengan Study Tour)" : "(Tanpa Study Tour)"}:
                      </td>
                      <td className="px-4 py-4 text-right text-indigo-700 bg-indigo-100/60 whitespace-nowrap">
                        {formatCurrency(currentSimulation.totalTransferRobotic)}
                      </td>
                      <td className="px-4 py-4 text-right text-rose-700 bg-rose-100/60 whitespace-nowrap">
                        {formatCurrency(currentSimulation.totalTanggunganPeserta)}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        Total I + II: {formatCurrency(currentSimulation.totalKeseluruhan)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Catatan & Pengesahan Dokumen RAB */}
              <div className="p-5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Catatan Resmi RAB (5 November 2026):</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>Harga tiket pesawat internasional mengacu pada tarif grup China Southern Airlines per Oktober 2026 (CZ8056 & CZ8353) dan dapat berubah sesuai ketersediaan kursi saat penerbitan tiket.</li>
                    <li>Biaya pendaftaran kategori kompetisi (A.5 = 3 kategori × USD 250) menggunakan kurs acuan USD 1 = Rp18.000.</li>
                    <li>Rincian II (Bagian C, D, dan E) merupakan estimasi untuk keperluan penganggaran internal Kemendikdasmen dan tidak ditransfer ke Robotic Explorer.</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-6 text-right">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Disusun Oleh</span>
                    <span className="font-bold text-slate-800">{IYRC_INFO.preparedBy.nama}</span>
                    <span className="block text-[11px] text-slate-500">{IYRC_INFO.preparedBy.jabatan}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Menyetujui</span>
                    <span className="font-bold text-slate-800">{IYRC_INFO.approvedBy.nama}</span>
                    <span className="block text-[11px] text-slate-500">{IYRC_INFO.approvedBy.jabatan}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== TAB 2: KONTINGEN & PESERTA ==================== */}
      {activeTab === "kontingen" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daftar Kontingen & Status Peserta ({participants.length} Orang)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Komposisi Resmi RAB 5 Nov 2026: 4 Siswa (2 SMP & 2 SMA) + 2 Guru Pendamping. Klik ikon pensil untuk mengubah nama (termasuk placeholder SNT 15 Buton Tengah), paspor, atau status pembayaran.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={handleSyncLatest}
                disabled={isSubmitting}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Sinkron Data 5 Nov
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Plus size={16} /> Tambah Peserta / Pendamping
              </button>
            </div>
          </div>

          {/* Catatan Pendamping Kementerian (A4) */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-950">
            <div className="space-y-0.5">
              <div className="font-extrabold flex items-center gap-2 text-amber-900">
                <ShieldCheck size={16} className="text-amber-600" />
                <span>Catatan Pendamping Kementerian (Kemendikdasmen) & Pergantian Pendamping</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                • Dalam dokumen <em>Informasi Perjalanan Delegasi</em> tercantum 1 slot opsional <strong>[Nama – bila ada] (Pendamping Kementerian – Kemendikdasmen)</strong>. Sesuai keputusan, slot ini belum dimasukkan ke perhitungan RAB 6 orang dan ditampilkan sebagai catatan informasi.<br />
                • Guru Pendamping SNT 5 Tidore Kepulauan telah diperbarui menjadi <strong>Farid A. M, S.Sos., M.M.</strong> (Kepala Sekolah), menggantikan Dr. Almindo H. Ginting.
              </p>
            </div>
          </div>

          <Card className="shadow-sm overflow-hidden border border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 text-left">Nama Peserta</th>
                      <th className="px-5 py-3.5 text-center">Peran & Jenjang</th>
                      <th className="px-5 py-3.5 text-left">SNT & Keterangan</th>
                      <th className="px-5 py-3.5 text-right">Biaya Kompetisi (Rincian I)</th>
                      <th className="px-5 py-3.5 text-right">Estimasi Perjalanan (Rincian II)</th>
                      <th className="px-5 py-3.5 text-center">Status Bayar</th>
                      <th className="px-5 py-3.5 text-right">Terbayar</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {participants.map((p) => {
                      const sisa = p.biayaPerjalananVisa - (p.nominalTerbayar || 0);
                      const isPlaceholder = p.nama.includes("[");
                      return (
                        <tr key={p.id} className={`hover:bg-slate-50/60 transition-colors ${isPlaceholder ? "bg-amber-50/30" : ""}`}>
                          <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{p.nama}</span>
                              {isPlaceholder && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                                  Klik Edit untuk Isi Nama
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-normal text-slate-400 mt-0.5">
                              Paspor: {p.nomorPaspor || "Belum diisi"} · NISN/NIP: {p.nisnOrNip || "-"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                p.peran === "SISWA"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              }`}
                            >
                              {p.peran === "SISWA" ? "Siswa (Paket A)" : "Guru Pendamping"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            <div className="font-semibold text-xs text-indigo-800">{p.sntAsal}</div>
                            <div className="text-xs text-slate-500">{p.sekolahAsal || "-"}</div>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-indigo-700 whitespace-nowrap">
                            {formatCurrency(p.biayaKompetisi)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-rose-600 whitespace-nowrap">
                            {formatCurrency(p.biayaPerjalananVisa)}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                p.statusPembayaran === "LUNAS"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : p.statusPembayaran === "CICILAN"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {p.statusPembayaran}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="font-bold text-emerald-700">{formatCurrency(p.nominalTerbayar || 0)}</div>
                            {sisa > 0 && <div className="text-[11px] text-rose-500 font-medium">Sisa: {formatCurrency(sisa)}</div>}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedParticipant(p);
                                  setPaymentForm({
                                    nama: p.nama || "",
                                    sntAsal: p.sntAsal || "",
                                    sekolahAsal: p.sekolahAsal || "",
                                    nisnOrNip: p.nisnOrNip || "",
                                    nomorPaspor: p.nomorPaspor || "",
                                    statusPembayaran: p.statusPembayaran || "BELUM_LUNAS",
                                    nominalTerbayar: p.nominalTerbayar || 0,
                                    catatan: p.catatan || "",
                                  });
                                  setShowEditPaymentModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="Edit Nama, Identitas & Status Pembayaran"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteParticipant(p.id, p.nama)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Hapus Peserta"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== TAB 3: PELATIHAN & HOTEL JAKARTA (3 OPSI) ==================== */}
      {activeTab === "pelatihan" && (
        <div className="space-y-6">
          {/* Header Ringkasan Akomodasi Pelatihan */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
                  <Hotel size={14} /> Pos Terpisah · Tanggungan Robotic Explorer
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  RAB Akomodasi Hotel Pelatihan Intensif Siswa di Jakarta
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan 3 opsi hotel sekitar <strong>{JAKARTA_TRAINING_STAY.lokasiPelatihan}</strong> (Status: <strong>Belum Dipilih – Menampilkan Perbandingan</strong>)
                </p>
              </div>
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs space-y-1 shrink-0">
                <div className="font-extrabold text-emerald-950">Parameter Menginap (Disinkronkan):</div>
                <div className="text-slate-700">• Check-in: <strong>{JAKARTA_TRAINING_STAY.checkIn}</strong></div>
                <div className="text-slate-700">• Check-out: <strong>{JAKARTA_TRAINING_STAY.checkOut}</strong></div>
                <div className="text-slate-700">• Volume: <strong>{JAKARTA_TRAINING_STAY.jumlahKamar} Kamar Twin × {JAKARTA_TRAINING_STAY.jumlahMalam} Malam = {JAKARTA_TRAINING_STAY.totalKamarMalam} Kamar-Malam</strong></div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
              <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Catatan Penyesuaian Tanggal ({JAKARTA_TRAINING_STAY.checkIn} – {JAKARTA_TRAINING_STAY.checkOut}):</strong>{" "}
                {JAKARTA_TRAINING_STAY.catatanSinkronisasi}
              </div>
            </div>

            {/* 3 Kartu Perbandingan Hotel Grogol */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
              {jakartaHotelComparison.map((h) => (
                <Card
                  key={h.id}
                  className={`shadow-sm overflow-hidden transition-all ${
                    h.rekomendasi
                      ? "border-2 border-emerald-500 ring-2 ring-emerald-500/10"
                      : "border border-slate-200"
                  }`}
                >
                  <CardHeader className={`${h.rekomendasi ? "bg-emerald-50/70" : "bg-slate-50/70"} border-b pb-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                        Opsi {h.opsi} · Bintang {h.bintang} ({h.bintang}★)
                      </span>
                      {h.rekomendasi && (
                        <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                          Rekomendasi Efisiensi
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-extrabold text-slate-900 mt-1">{h.nama}</CardTitle>
                    <p className="text-[11px] text-slate-500">{h.alamat}</p>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-600 border-b pb-2">
                      <span>Jarak ke Tempat Pelatihan:</span>
                      <strong className="text-slate-900">{h.jarakKeVenue}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 border-b pb-2">
                      <span>Tipe Kamar:</span>
                      <strong className="text-slate-900">{h.tipeKamar}</strong>
                    </div>
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-500">1.1 Sewa Kamar ({h.kamarMalam} kmr-mlm × {formatCurrency(h.tarifDasarMalam)}):</span>
                        <span className="font-bold text-slate-800">{formatCurrency(h.sewaKamar)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">1.2 Service Charge (10%):</span>
                        <span className="font-semibold text-slate-700">{formatCurrency(h.serviceCharge)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">1.3 Pajak Hotel / PBJT (10%):</span>
                        <span className="font-semibold text-slate-700">{formatCurrency(h.pajakPbjt)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-indigo-900">
                        <span>Total 26 Malam (2 Kamar):</span>
                        <span>{formatCurrency(h.totalBiaya)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Nett/Kamar/Mlm</span>
                        <span className="font-extrabold text-slate-800 text-[11px]">{formatCurrency(h.tarifEfektifKamarMalam)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Per Siswa (26 mlm)</span>
                        <span className="font-extrabold text-indigo-700 text-[11px]">{formatCurrency(h.perSiswa)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Per Siswa/Mlm</span>
                        <span className="font-extrabold text-slate-800 text-[11px]">{formatCurrency(h.perSiswaPerMalam)}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">{h.catatan}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Jadwal Pelatihan Intensif 4 Pekan (15 Nov - 9 Des 2026) */}
          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="border-b bg-slate-50/70 py-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap size={18} className="text-indigo-600" /> Program Pelatihan Intensif Siswa di Jakarta (15 November – 9 Desember 2026)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Total 4 Pekan · 19 Sesi @ 4 Jam · Lokasi: Robotic Explorer Center, Greenville Blok AL No. 1A–B, Jakarta Barat
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="px-5 py-3 text-left w-28">Pekan</th>
                      <th className="px-5 py-3 text-left w-48">Periode Tanggal</th>
                      <th className="px-5 py-3 text-center w-28">Jumlah Sesi</th>
                      <th className="px-5 py-3 text-left">Fokus Materi & Persiapan Lomba (3 Kategori)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {TRAINING_WEEKS.map((w) => (
                      <tr key={w.minggu} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3.5 font-extrabold text-indigo-800 whitespace-nowrap">{w.minggu}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{w.periode}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                            {w.jumlahSesi}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 leading-relaxed">{w.fokusMateri}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== TAB 4: ITINERARY, PENERBANGAN & VISA ==================== */}
      {activeTab === "itinerary" && (
        <div className="space-y-6">
          {/* HEADER ACTION BANNER */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" /> Informasi Perjalanan Delegasi & Jadwal Kegiatan Lomba (Versi 5 Nov 2026)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rundown resmi penerbangan China Southern (CZ8056 & CZ8353), Zhongbao International Hotel Shenzhen, timeline Visa CVASC, serta Opsi Study Tour (14–16 Des).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowItineraryPrintModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0"
            >
              <FileDown size={16} /> Export / Cetak PDF Rencana Perjalanan Detail
            </button>
          </div>

          {/* FLIGHT & HOTEL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-indigo-200 shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
              <CardHeader className="pb-3 border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-full">
                    Penerbangan Berangkat
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Jumat, 11 Des 2026</span>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2 flex items-center gap-2">
                  <Plane size={18} className="text-indigo-600 rotate-45" /> China Southern CZ8056
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div>
                    <div className="text-lg font-extrabold text-indigo-700">09.05 WIB</div>
                    <div className="text-xs text-slate-500">Jakarta (CGK) · T3</div>
                  </div>
                  <ArrowRight size={18} className="text-indigo-400" />
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-indigo-700">15.25 CST</div>
                    <div className="text-xs text-slate-500">Shenzhen (SZX) · T3</div>
                  </div>
                </div>
                <div className="pt-2 text-xs text-slate-500 border-t border-indigo-100 flex items-center justify-between">
                  <span>Airbus A320neo · Non-stop</span>
                  <span>Durasi: 5j 20m</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-violet-200 shadow-sm bg-gradient-to-br from-white to-violet-50/30">
              <CardHeader className="pb-3 border-b border-violet-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-100/70 px-2.5 py-1 rounded-full">
                    Kepulangan (Tanpa Study Tour)
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Senin, 14 Des 2026</span>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2 flex items-center gap-2">
                  <Plane size={18} className="text-violet-600 -rotate-45" /> China Southern CZ8353
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div>
                    <div className="text-lg font-extrabold text-violet-700">19.05 CST</div>
                    <div className="text-xs text-slate-500">Shenzhen (SZX) · T3</div>
                  </div>
                  <ArrowRight size={18} className="text-violet-400" />
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-violet-700">23.20 WIB</div>
                    <div className="text-xs text-slate-500">Jakarta (CGK) · T3</div>
                  </div>
                </div>
                <div className="pt-2 text-xs text-slate-500 border-t border-violet-100 flex items-center justify-between">
                  <span>Airbus A321neo · 5j 15m</span>
                  <span>Subuh 15 Des ke daerah asal</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
              <CardHeader className="pb-3 border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                    Hotel Resmi Shenzhen
                  </span>
                  <span className="text-xs font-semibold text-slate-500">11–14 Des (3 Malam)</span>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2 flex items-center gap-2">
                  <Hotel size={18} className="text-emerald-600" /> Zhongbao International Hotel
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs text-slate-600">
                <div className="font-bold text-slate-900">深圳中保国际酒店 · Longhua District</div>
                <div>No. 21 Donghuan 2nd Road, Longhua District, Shenzhen, Guangdong</div>
                <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-slate-500">
                  <span>±15 km ke Venue Longgang</span>
                  <span className="font-semibold text-emerald-700">Paket A.4 & B.1</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ITINERARY UTAMA (10-15 DESEMBER 2026) */}
          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="border-b bg-slate-50/60 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" /> Rencana Perjalanan Utama (Kamis, 10 Des – Selasa, 15 Des 2026)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jadwal resmi keberangkatan, kompetisi di Longgang International Arts Center, dan kepulangan reguler (Tanpa Study Tour)
                </p>
              </div>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                Paket Utama · 4H3M di Shenzhen
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left w-36">Hari / Tanggal</th>
                      <th className="px-4 py-3 text-left w-28">Waktu</th>
                      <th className="px-4 py-3 text-left">Kegiatan</th>
                      <th className="px-4 py-3 text-left w-56">Lokasi / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {MAIN_ITINERARY.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-bold text-indigo-900 whitespace-nowrap">{row.hariTanggal}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{row.waktu}</td>
                        <td className="px-4 py-3 text-slate-800">{row.kegiatan}</td>
                        <td className="px-4 py-3 text-slate-500">{row.lokasiKeterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* OPSI TAMBAHAN STUDY TOUR (14-16 DESEMBER 2026) */}
          <Card className="shadow-sm border border-amber-200 bg-amber-50/20">
            <CardHeader className="border-b border-amber-200 bg-amber-50/60 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-amber-950 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-600" /> Opsi Tambahan: Program Study Tour Shenzhen (Senin, 14 Des – Rabu, 16 Des 2026)
                </CardTitle>
                <p className="text-xs text-amber-800 mt-0.5">
                  Biaya Tambahan: <strong>+Rp6.500.000 / orang</strong> (+Rp39.000.000 untuk 6 orang) · Kepulangan melalui Bandara Guangzhou Baiyun (CAN)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStudyTour(!studyTour);
                  setActiveTab("rab");
                }}
                className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl transition-all shrink-0"
              >
                {studyTour ? "Study Tour Aktif di Simulasi RAB" : "Simulasikan Study Tour di RAB"}
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200/70 text-xs">
                  <thead className="bg-amber-100/50 font-bold text-amber-900 uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left w-36">Hari / Tanggal</th>
                      <th className="px-4 py-2.5 text-left w-28">Waktu</th>
                      <th className="px-4 py-2.5 text-left">Kegiatan Study Tour</th>
                      <th className="px-4 py-2.5 text-left w-56">Lokasi / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 bg-white">
                    {STUDY_TOUR_ITINERARY.map((row, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40">
                        <td className="px-4 py-2.5 font-bold text-amber-900 whitespace-nowrap">{row.hariTanggal}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{row.waktu}</td>
                        <td className="px-4 py-2.5 text-slate-800">{row.kegiatan}</td>
                        <td className="px-4 py-2.5 text-slate-500">{row.lokasiKeterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* VISA APPLICATION TIMELINE & DOCUMENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b bg-slate-50/60">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600" /> Timeline Pengurusan Visa China (CVASC Jakarta)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="p-3 text-left">Tahapan</th>
                      <th className="p-3 text-left">Target Waktu</th>
                      <th className="p-3 text-left">PIC / Pelaksana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {VISA_TIMELINE.map((v, i) => (
                      <tr key={i}>
                        <td className="p-3 font-semibold text-slate-800">{v.tahap}</td>
                        <td className="p-3 font-bold text-indigo-700 whitespace-nowrap">{v.targetWaktu}</td>
                        <td className="p-3 text-slate-500">{v.penanggungJawab}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
              <CardHeader className="pb-3 border-b border-amber-200">
                <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <FileText size={18} className="text-amber-600" /> Kelengkapan Dokumen Visa China (Wajib)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5 text-xs text-slate-800">
                <ul className="space-y-2">
                  {VISA_DOCUMENTS.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-sm">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: INVITATION LETTER & IZIN DINAS ==================== */}
      {activeTab === "invitation" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Konfigurasi Surat Undangan (Individual Per Peserta)</h3>
                <p className="text-xs text-slate-500">
                  Surat resmi perorangan sebagai dasar permohonan Surat Izin Perjalanan Dinas Luar Negeri ke Pemda/Dinas & verifikasi Visa China.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLetterPrintModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
                >
                  <Printer size={16} /> Cetak Dokumen (Bisa Pilih 1, 2, atau 3 Dokumen)
                </button>
              </div>
            </div>

            {/* Quick Participant Selector Buttons */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Pilih Peserta (Surat Dibuat Mandiri per Siswa / Pendamping):
              </label>
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => {
                  const isSelected = p.id === selectedLetterParticipant;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedLetterParticipant(p.id);
                        setLetterRecipient(`Kepala ${p.sntAsal}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <User size={13} />
                      {p.nama} ({p.peran === "SISWA" ? "Siswa" : "Guru"}) - {p.sntAsal}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold pt-2">
              <div>
                <label className="block text-slate-600 mb-1">Bahasa Dokumen:</label>
                <select
                  value={letterLanguage}
                  onChange={(e: any) => setLetterLanguage(e.target.value)}
                  className="w-full border-slate-300 rounded-xl border px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="id">Bahasa Indonesia (Izin Dinas Luar Negeri)</option>
                  <option value="en">English (Official IYRC Invitation Letter)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Tujuan Surat (Kepada Yth):</label>
                <input
                  type="text"
                  value={letterRecipient}
                  onChange={(e) => setLetterRecipient(e.target.value)}
                  placeholder={`Kepala ${currentLetterParticipant?.sntAsal || "SNT"}`}
                  className="w-full border-slate-300 rounded-xl border px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Nomor Surat (Diisi Manual Saat Cetak):</label>
                <input
                  type="text"
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  placeholder="Contoh: 088/RE-IYRC/XI/2026"
                  className="w-full border-slate-300 rounded-xl border px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Tanggal Surat:</label>
                <input
                  type="text"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="w-full border-slate-300 rounded-xl border px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* DYNAMIC SIGNATORIES CONTROLLER */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-700">Pengaturan Tanda Tangan:</span>
                  <span className="text-[11px] text-slate-500 ml-2">
                    (TTD utama di sebelah kanan; jika menambah TTD, otomatis tampil di sebelah kiri)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSignatories([
                      ...signatories,
                      { nama: "Nama Pejabat Pendamping", jabatan: "Jabatan Pejabat", instansi: "Instansi / Sekolah" },
                    ])
                  }
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1"
                >
                  <Plus size={13} /> Tambah TTD (Sebelah Kiri)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {signatories.map((sig, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative text-xs space-y-1.5">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => setSignatories(signatories.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-600"
                        title="Hapus tanda tangan tambahan ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {idx === 0 ? "TTD Utama (Sebelah Kanan):" : `TTD Tambahan ${idx} (Sebelah Kiri):`}
                      </span>
                      <input
                        type="text"
                        value={sig.nama}
                        onChange={(e) => {
                          const updated = [...signatories];
                          updated[idx].nama = e.target.value;
                          setSignatories(updated);
                        }}
                        className="w-full border-slate-300 rounded border px-2 py-1 text-xs font-bold text-slate-800 mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Jabatan:</span>
                      <input
                        type="text"
                        value={sig.jabatan}
                        onChange={(e) => {
                          const updated = [...signatories];
                          updated[idx].jabatan = e.target.value;
                          setSignatories(updated);
                        }}
                        className="w-full border-slate-300 rounded border px-2 py-1 text-xs text-slate-700 mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Instansi:</span>
                      <input
                        type="text"
                        value={sig.instansi}
                        onChange={(e) => {
                          const updated = [...signatories];
                          updated[idx].instansi = e.target.value;
                          setSignatories(updated);
                        }}
                        className="w-full border-slate-300 rounded border px-2 py-1 text-xs text-slate-700 mt-0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PRINT PREVIEW PAPER */}
          <div id="printable-letter" className="printable-letter-container bg-white p-8 md:p-12 rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900">
            {/* KOP SURAT RESMI */}
            <div className="border-b-2 border-slate-900 pb-3 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-wider text-slate-900 uppercase">
                  PT. JULLY TJINDRAWAN ROBOTIK
                </h2>
                <p className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
                  ROBOTIC EXPLORER · OFFICIAL IYRC INDONESIA REPRESENTATIVE · KORWIL 2 SNT
                </p>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">
                  Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510 · info@worldroboticexplorer.com · 0822-9898-4848
                </p>
              </div>
              <div className="text-right border-l-2 border-indigo-600 pl-4 shrink-0">
                <span className="text-xs font-black text-indigo-900 uppercase block">IYRC 2026</span>
                <span className="text-[10px] text-slate-500 font-semibold">Shenzhen, China</span>
              </div>
            </div>

            {/* ISI SURAT: BAHASA INDONESIA */}
            {letterLanguage === "id" ? (
              <div className="space-y-4 text-sm leading-relaxed text-slate-800">
                <div className="flex justify-between text-xs">
                  <div>
                    <p className="cursor-pointer group flex items-center gap-1" onClick={() => setShowLetterPrintModal(true)} title="Klik untuk ubah nomor surat">
                      <span>Nomor : <strong>{letterNumber || "......./RE-IYRC/XI/2026"}</strong></span>
                      <span className="no-print text-[10px] text-indigo-600 underline font-normal opacity-70 group-hover:opacity-100">
                        [Ubah Nomor]
                      </span>
                    </p>
                    <p>Lampiran : 1 (satu) Berkas Rencana Anggaran & Jadwal Perjalanan</p>
                    <p>Perihal : <strong>Undangan Resmi & Rekomendasi Izin Perjalanan Dinas Luar Negeri</strong></p>
                  </div>
                  <div className="text-right">
                    <p>Jakarta, {letterDate}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p>Kepada Yth,</p>
                  <p className="font-bold text-slate-900">{letterRecipient || `Kepala ${currentLetterParticipant?.sntAsal}`}</p>
                  <p>di Tempat</p>
                </div>

                <p className="pt-2">Dengan hormat,</p>
                <p className="text-justify">
                  Sehubungan dengan terpilihnya {currentLetterParticipant?.peran === "SISWA" ? "putra/putri terbaik" : "pendidik berprestasi"} dari {currentLetterParticipant?.sntAsal} untuk mewakili kontingen Indonesia pada ajang kompetisi robotika dan kecerdasan buatan (AI) tingkat dunia:
                </p>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">Nama Acara : The 14th IYRC International Youth Robotics and AI Competition</p>
                  <p>Waktu Kegiatan : 12 – 13 Desember 2026 (Periode Perjalanan: 10 – 15 Desember 2026)</p>
                  <p>Tempat Pelaksanaan : Longgang International Arts Center, Shenzhen, Republik Rakyat Tiongkok (RRT)</p>
                  <p>Akomodasi Hotel : Zhongbao International Hotel (深圳中保国际酒店), Longhua District, Shenzhen</p>
                  <p>Penerbangan : China Southern Airlines CZ8056 (11 Des) & CZ8353 (14 Des)</p>
                </div>

                <p className="text-justify pt-1">
                  Bersama ini kami menerbitkan <strong>Surat Undangan Resmi</strong> serta mengajukan permohonan <strong>Izin Perjalanan Dinas Luar Negeri</strong> dan dispensasi {currentLetterParticipant?.peran === "SISWA" ? "belajar/sekolah" : "tugas kedinasan"} kepada yang bersangkutan:
                </p>

                {/* TABEL DATA INDIVIDU SISWA / GURU (BUKAN KOLEKTIF) */}
                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs my-2.5 bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 bg-slate-50 font-bold text-slate-700 w-1/3">Nama Lengkap</td>
                        <td className="p-2.5 font-black text-slate-900 uppercase tracking-wide text-sm">
                          {currentLetterParticipant?.nama}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 bg-slate-50 font-bold text-slate-700">Peran / Kategori</td>
                        <td className="p-2.5 font-bold text-indigo-900">
                          {currentLetterParticipant?.peran === "SISWA"
                            ? "Siswa Peserta Kompetisi (Paket A - Robotika & AI)"
                            : "Guru Pendamping & Pembimbing Teknis Kontingen"}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 bg-slate-50 font-bold text-slate-700">Asal Program SNT</td>
                        <td className="p-2.5 font-bold text-slate-900">{currentLetterParticipant?.sntAsal}</td>
                      </tr>
                      {currentLetterParticipant?.peran !== "SISWA" && currentLetterParticipant?.sekolahAsal && (
                        <tr>
                          <td className="p-2.5 bg-slate-50 font-bold text-slate-700">Instansi Asal</td>
                          <td className="p-2.5 font-medium">{currentLetterParticipant?.sekolahAsal}</td>
                        </tr>
                      )}
                      {currentLetterParticipant?.nomorPaspor && (
                        <tr>
                          <td className="p-2.5 bg-slate-50 font-bold text-slate-700">Nomor Paspor</td>
                          <td className="p-2.5 font-mono">{currentLetterParticipant?.nomorPaspor}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="text-justify">
                  Segala persiapan pelatihan intensif (15 November – 9 Desember 2026 di Jakarta), registrasi resmi, dan akomodasi di Shenzhen dikoordinasikan secara penuh di bawah pengawasan PT. Jully Tjindrawan Robotik (Robotic Explorer). Surat ini diterbitkan sebagai dokumen resmi penunjang pengajuan izin dinas luar negeri serta rekomendasi pembuatan dokumen perjalanan (Visa/Paspor).
                </p>

                <p>Demikian surat undangan dan rekomendasi ini kami sampaikan. Atas perhatian, dukungan, dan kerja sama yang baik, kami ucapkan terima kasih.</p>
              </div>
            ) : (
              /* ISI SURAT: ENGLISH */
              <div className="space-y-4 text-sm leading-relaxed text-slate-800">
                <div className="flex justify-between text-xs">
                  <div>
                    <p className="cursor-pointer group flex items-center gap-1" onClick={() => setShowLetterPrintModal(true)} title="Click to edit reference number">
                      <span>Reference No : <strong>{letterNumber || "......./RE-IYRC/XI/2026"}</strong></span>
                      <span className="no-print text-[10px] text-indigo-600 underline font-normal opacity-70 group-hover:opacity-100">
                        [Edit Number]
                      </span>
                    </p>
                    <p>Enclosure : 1 (One) Complete Schedule & Travel Budget Document</p>
                    <p>Subject : <strong>Official Invitation & Clearance Endorsement – The 14th IYRC China 2026</strong></p>
                  </div>
                  <div className="text-right">
                    <p>Jakarta, {letterDate}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p>To Whom It May Concern,</p>
                  <p className="font-bold text-slate-900">{letterRecipient || `Head of ${currentLetterParticipant?.sntAsal} & Immigration Authorities`}</p>
                  <p>In Indonesia / Embassy of the People's Republic of China</p>
                </div>

                <p className="text-justify pt-2">
                  This official document serves as a formal confirmation and invitation for the delegate from {currentLetterParticipant?.sntAsal} to attend and compete in <strong>The 14th IYRC International Youth Robotics and AI Competition</strong>, held in Shenzhen, People's Republic of China.
                </p>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">Event : The 14th IYRC International Youth Robotics and AI Competition</p>
                  <p>Date of Competition : December 12–13, 2026 (Travel Period: December 10–15, 2026)</p>
                  <p>Venue : Longgang International Arts Center, Shenzhen, China</p>
                  <p>Official Hotel : Zhongbao International Hotel (深圳中保国际酒店), No. 21 Donghuan 2nd Rd, Longhua, Shenzhen</p>
                  <p>Flight Details : China Southern Airlines CZ8056 (Dec 11, CGK 09:05 → SZX 15:25) / Return CZ8353 (Dec 14, SZX 19:05 → CGK 23:20)</p>
                </div>

                <p className="text-justify pt-1">
                  We proudly certify that the individual named below has been officially selected and endorsed:
                </p>

                {/* TABEL DATA INDIVIDU (ENGLISH) */}
                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs my-2.5 bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 bg-slate-50 font-bold text-slate-700 w-1/3">Full Name</td>
                        <td className="p-2.5 font-black text-slate-900 uppercase tracking-wide text-sm">
                          {currentLetterParticipant?.nama}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 bg-slate-50 font-bold text-slate-700">Role / Designation</td>
                        <td className="p-2.5 font-bold text-indigo-900">
                          {currentLetterParticipant?.peran === "SISWA"
                            ? "Student Competitor (Package A - Robotics & AI)"
                            : "Official Teacher, Coach & Chaperone"}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 bg-slate-50 font-bold text-slate-700">SNT Regional Center</td>
                        <td className="p-2.5 font-bold text-slate-900">{currentLetterParticipant?.sntAsal}</td>
                      </tr>
                      {currentLetterParticipant?.peran !== "SISWA" && currentLetterParticipant?.sekolahAsal && (
                        <tr>
                          <td className="p-2.5 bg-slate-50 font-bold text-slate-700">Institution / Affiliation</td>
                          <td className="p-2.5 font-medium">{currentLetterParticipant?.sekolahAsal}</td>
                        </tr>
                      )}
                      {currentLetterParticipant?.nomorPaspor && (
                        <tr>
                          <td className="p-2.5 bg-slate-50 font-bold text-slate-700">Passport Number</td>
                          <td className="p-2.5 font-mono">{currentLetterParticipant?.nomorPaspor}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="text-justify">
                  All delegation members will be accommodated and supervised during the event period by Robotic Explorer. We kindly request the Embassy and Immigration authorities to grant the necessary entry visa and international travel clearances.
                </p>

                <p>Thank you for your kind assistance and cooperation.</p>
              </div>
            )}

            {/* TANDA TANGAN DINAMIS: UTAMA DI SEBELAH KANAN, JIKA MENAMBAH TTD MUNCUL DI SEBELAH KIRI */}
            {renderSignatures()}
          </div>
        </div>
      )}

      {/* ==================== TAB 5: GENERATOR BALASAN WHATSAPP ==================== */}
      {activeTab === "whatsapp" && (
        <div className="space-y-6">
          <Card className="border-emerald-200 shadow-sm bg-emerald-50/20">
            <CardHeader className="border-b border-emerald-100 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <Share2 size={18} className="text-emerald-600" /> Teks Balasan WhatsApp Siap Kirim (1-Klik Salin · Versi 5 Nov 2026)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teks ini telah disinkronkan dengan dokumen terbaru (Pelatihan Jakarta 15 Nov–9 Des, Hotel Zhongbao Longhua, Flight CZ8056/CZ8353, dan Timeline Visa CVASC).
                </p>
              </div>
              <button
                onClick={handleCopyWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <Share2 size={15} /> Salin Teks WA
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-inner font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                {whatsappText}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== MODAL TAMBAH PESERTA ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Peserta / Pendamping IYRC</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={newParticipant.nama}
                  onChange={(e) => setNewParticipant({ ...newParticipant, nama: e.target.value })}
                  placeholder="Contoh: Muhammad Rayhan"
                  className="w-full border-slate-300 rounded-xl border p-2.5 text-xs text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Peran:</label>
                  <select
                    value={newParticipant.peran}
                    onChange={(e: any) => setNewParticipant({ ...newParticipant, peran: e.target.value })}
                    className="w-full border-slate-300 rounded-xl border p-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="SISWA">Siswa (Paket A)</option>
                    <option value="GURU_PENDAMPING">Guru Pendamping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Asal SNT:</label>
                  <input
                    type="text"
                    required
                    value={newParticipant.sntAsal}
                    onChange={(e) => setNewParticipant({ ...newParticipant, sntAsal: e.target.value })}
                    placeholder="Contoh: SNT 15 Buton Tengah"
                    className="w-full border-slate-300 rounded-xl border p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Jenjang / Jabatan / Keterangan:</label>
                <input
                  type="text"
                  value={newParticipant.sekolahAsal}
                  onChange={(e) => setNewParticipant({ ...newParticipant, sekolahAsal: e.target.value })}
                  placeholder="Contoh: Siswa SMA / Kepala Sekolah"
                  className="w-full border-slate-300 rounded-xl border p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">NISN / NIP:</label>
                  <input
                    type="text"
                    value={newParticipant.nisnOrNip}
                    onChange={(e) => setNewParticipant({ ...newParticipant, nisnOrNip: e.target.value })}
                    className="w-full border-slate-300 rounded-xl border p-2.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nomor Paspor:</label>
                  <input
                    type="text"
                    value={newParticipant.nomorPaspor}
                    onChange={(e) => setNewParticipant({ ...newParticipant, nomorPaspor: e.target.value })}
                    placeholder="Kosongkan jika belum ada"
                    className="w-full border-slate-300 rounded-xl border p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Peserta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL EDIT DATA & PEMBAYARAN PESERTA ==================== */}
      {showEditPaymentModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Identitas & Status Pembayaran Peserta</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Anda dapat mengubah nama lengkap (mis. mengisi nama siswa SNT 15 Buton Tengah), paspor, maupun status pembayaran.
                </p>
              </div>
              <button onClick={() => setShowEditPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Peserta / Pendamping:</label>
                <input
                  type="text"
                  value={paymentForm.nama}
                  onChange={(e) => setPaymentForm({ ...paymentForm, nama: e.target.value })}
                  className="w-full border-indigo-300 rounded-xl border p-2.5 text-xs text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Asal SNT:</label>
                  <input
                    type="text"
                    value={paymentForm.sntAsal}
                    onChange={(e) => setPaymentForm({ ...paymentForm, sntAsal: e.target.value })}
                    className="w-full border-slate-300 rounded-xl border p-2 text-xs text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Jenjang / Jabatan:</label>
                  <input
                    type="text"
                    value={paymentForm.sekolahAsal}
                    onChange={(e) => setPaymentForm({ ...paymentForm, sekolahAsal: e.target.value })}
                    className="w-full border-slate-300 rounded-xl border p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nomor Paspor:</label>
                  <input
                    type="text"
                    value={paymentForm.nomorPaspor}
                    onChange={(e) => setPaymentForm({ ...paymentForm, nomorPaspor: e.target.value })}
                    placeholder="Isi nomor paspor"
                    className="w-full border-slate-300 rounded-xl border p-2 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">NISN / NIP:</label>
                  <input
                    type="text"
                    value={paymentForm.nisnOrNip}
                    onChange={(e) => setPaymentForm({ ...paymentForm, nisnOrNip: e.target.value })}
                    className="w-full border-slate-300 rounded-xl border p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Biaya Kompetisi (Rincian I):</span>
                  <span className="text-sm font-extrabold text-indigo-700">
                    {formatCurrency(selectedParticipant.biayaKompetisi)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Estimasi Perjalanan & Visa (Rincian II):</span>
                  <span className="text-sm font-extrabold text-rose-600">
                    {formatCurrency(selectedParticipant.biayaPerjalananVisa)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Status Pembayaran:</label>
                  <select
                    value={paymentForm.statusPembayaran}
                    onChange={(e: any) => setPaymentForm({ ...paymentForm, statusPembayaran: e.target.value })}
                    className="w-full border-slate-300 rounded-xl border p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="BELUM_LUNAS">BELUM LUNAS</option>
                    <option value="CICILAN">CICILAN</option>
                    <option value="LUNAS">LUNAS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nominal Terbayar (Rp):</label>
                  <input
                    type="number"
                    value={paymentForm.nominalTerbayar}
                    onChange={(e) => setPaymentForm({ ...paymentForm, nominalTerbayar: Number(e.target.value) || 0 })}
                    className="w-full border-slate-300 rounded-xl border p-2.5 text-xs text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Catatan:</label>
                <textarea
                  value={paymentForm.catatan}
                  onChange={(e) => setPaymentForm({ ...paymentForm, catatan: e.target.value })}
                  rows={2}
                  placeholder="Catatan peserta, status paspor, atau bukti bayar..."
                  className="w-full border-slate-300 rounded-xl border p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditPaymentModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL PENGISIAN NOMOR SURAT & KONFIRMASI CETAK ==================== */}
      {showLetterPrintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Printer size={18} className="text-indigo-600" /> Cetak Berkas Dokumen Resmi IYRC
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Peserta: <strong className="text-slate-800">{currentLetterParticipant?.nama}</strong> ({currentLetterParticipant?.sntAsal})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLetterPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Checklist Multi-Select Dokumen */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-800 font-bold text-xs">
                    Pilih Dokumen yang Ingin Dicetak (Bisa 1, 2, atau Semua):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDocs({ id: true, en: true, itinerary: true })}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Pilih Semua (3)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDocs({ id: false, en: false, itinerary: false })}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                    >
                      Hapus Pilihan
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Opsi 1: Surat Bahasa Indonesia */}
                  <div
                    onClick={() => setSelectedDocs((prev) => ({ ...prev, id: !prev.id }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      selectedDocs.id
                        ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.id}
                      onChange={(e) => setSelectedDocs((prev) => ({ ...prev, id: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs">1. Surat Undangan Resmi (Bahasa Indonesia)</span>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Izin Dinas Pemda</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dasar permohonan izin dinas luar negeri & dispensasi sekolah ke Pemda / Dinas Pendidikan.
                      </p>
                    </div>
                  </div>

                  {/* Opsi 2: Official English Letter */}
                  <div
                    onClick={() => setSelectedDocs((prev) => ({ ...prev, en: !prev.en }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      selectedDocs.en
                        ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.en}
                      onChange={(e) => setSelectedDocs((prev) => ({ ...prev, en: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs">2. Official Invitation Letter (English)</span>
                        <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Visa & Imigrasi</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dokumen berbahasa Inggris resmi untuk Kedutaan Besar RRT & verifikasi imigrasi China.
                      </p>
                    </div>
                  </div>

                  {/* Opsi 3: Lampiran Itinerary */}
                  <div
                    onClick={() => setSelectedDocs((prev) => ({ ...prev, itinerary: !prev.itinerary }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      selectedDocs.itinerary
                        ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.itinerary}
                      onChange={(e) => setSelectedDocs((prev) => ({ ...prev, itinerary: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs">3. Lampiran Rencana Perjalanan Detail (Itinerary)</span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Jadwal 10–16 Des 2026</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Rincian penerbangan China Southern, hotel, daftar kontingen, dan rundown lengkap jam demi jam.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Terpilih */}
                <div className="mt-2 flex items-center justify-between">
                  {selectedDocsCount === 0 ? (
                    <span className="text-[11px] font-bold text-rose-500">
                      ⚠️ Pilih minimal 1 dokumen untuk dicetak.
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-600">
                      Dokumen terpilih: <strong className="text-indigo-600">{selectedDocsCount} dari 3 dokumen</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Nomor Surat */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nomor Surat (Wajib / Diisi Manual):
                </label>
                <input
                  type="text"
                  autoFocus
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  placeholder="Contoh: 088/RE-IYRC/XI/2026"
                  className="w-full border-indigo-300 ring-2 ring-indigo-500/20 rounded-xl border p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <p className="text-[10px] text-indigo-600 mt-1 font-semibold">
                  *Nomor surat ini dicetak langsung pada surat resmi dan rujukan lampiran itinerary.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tanggal Surat */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Surat:</label>
                  <input
                    type="text"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="w-full border-slate-300 rounded-xl border p-2 text-xs text-slate-800 font-semibold"
                  />
                </div>

                {/* Tujuan Surat */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tujuan Surat:</label>
                  <input
                    type="text"
                    value={letterRecipient}
                    onChange={(e) => setLetterRecipient(e.target.value)}
                    placeholder={`Kepala ${currentLetterParticipant?.sntAsal}`}
                    className="w-full border-slate-300 rounded-xl border p-2 text-xs text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowLetterPrintModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedDocsCount === 0}
                  onClick={() => {
                    if (selectedDocsCount === 0) return;
                    setShowLetterPrintModal(false);
                    setTimeout(() => {
                      handlePrint("bundle");
                    }, 250);
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 ${
                    selectedDocsCount === 0
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                  }`}
                >
                  <Printer size={15} /> Cetak / Unduh PDF ({selectedDocsCount} Dokumen Terpilih)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL PREVIEW & CETAK ITINERARY DETAIL ==================== */}
      {showItineraryPrintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-6 shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header Modal Bar (Tidak Ikut Dicetak) */}
            <div className="p-4 border-b flex items-center justify-between bg-slate-50 rounded-t-2xl no-print">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" /> Dokumen Rencana Perjalanan Detail & Kegiatan Lomba
                </h3>
                <p className="text-[11px] text-slate-500">
                  Format resmi A4 siap dicetak atau disimpan sebagai PDF (Kop Surat, Delegasi, Penerbangan, Hotel, & Rundown Jam demi Jam).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintItinerary}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer size={15} /> Cetak / Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowItineraryPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Dokumen Rencana Perjalanan Siap Cetak (A4) */}
            <div id="printable-itinerary" className="p-6 md:p-10 overflow-y-auto printable-itinerary-container bg-white text-slate-900 space-y-6">
              {/* KOP SURAT RESMI */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-wider text-slate-900 uppercase">
                    PT. JULLY TJINDRAWAN ROBOTIK
                  </h2>
                  <p className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
                    ROBOTIC EXPLORER · OFFICIAL IYRC INDONESIA REPRESENTATIVE · KORWIL 2 SNT
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510 · info@worldroboticexplorer.com · 0822-9898-4848
                  </p>
                </div>
                <div className="text-right border-l-2 border-indigo-600 pl-4 shrink-0">
                  <span className="text-xs font-black text-indigo-900 uppercase block">IYRC 2026</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Shenzhen, China</span>
                </div>
              </div>

              {/* JUDUL DOKUMEN */}
              <div className="text-center space-y-1">
                <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  INFORMASI PERJALANAN DELEGASI & JADWAL KEGIATAN LOMBA (ITINERARY)
                </h1>
                <p className="text-xs font-bold text-indigo-700">
                  THE 14th IYRC INTERNATIONAL YOUTH ROBOTICS AND AI COMPETITION 2026
                </p>
                <p className="text-[11px] text-slate-500">
                  Lokasi: Longgang International Arts Center, Shenzhen, RRT · Periode Utama: 10 – 15 Desember 2026 (Versi 5 Nov 2026)
                </p>
              </div>

              {/* 1. INFORMASI PENERBANGAN & HOTEL RESMI */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1">
                  1. JADWAL PENERBANGAN RESMI & AKOMODASI HOTEL DI SHENZHEN
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-indigo-800 block mb-1">🛫 Keberangkatan (Jumat, 11 Des 2026)</span>
                    <p className="font-semibold text-slate-800">China Southern Airlines CZ8056</p>
                    <p className="text-slate-600 text-[11px]">Jakarta (CGK T3) 09:05 WIB &rarr; Shenzhen (SZX T3) 15:25 CST</p>
                    <p className="text-[10px] text-slate-500">Pesawat: Airbus A320neo · Non-stop (5j 20m)</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-violet-800 block mb-1">🛬 Kepulangan (Senin, 14 Des 2026)</span>
                    <p className="font-semibold text-slate-800">China Southern Airlines CZ8353</p>
                    <p className="text-slate-600 text-[11px]">Shenzhen (SZX T3) 19:05 CST &rarr; Jakarta (CGK T3) 23:20 WIB</p>
                    <p className="text-[10px] text-slate-500">Pesawat: Airbus A321neo · Lanjut subuh 15 Des ke daerah asal</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-emerald-800 block mb-1">🏨 Hotel Resmi (11–14 Des · 3 Malam)</span>
                    <p className="font-semibold text-slate-800">Zhongbao International Hotel (深圳中保国际酒店)</p>
                    <p className="text-slate-600 text-[11px]">No. 21 Donghuan 2nd Road, Longhua District, Shenzhen</p>
                    <p className="text-[10px] text-slate-500">±15 km ke Venue Longgang · Termasuk makan & shuttle</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  *Catatan Pelatihan & Domestik: Siswa mengikuti pelatihan intensif di Jakarta pada 15 Nov – 9 Des 2026; Guru Pendamping tiba di Jakarta pada Kamis, 10 Des 2026; seluruh delegasi kembali ke daerah asal pada Selasa, 15 Des 2026 subuh (atau Rabu, 16 Des via Guangzhou CAN bila mengambil Opsi Study Tour).
                </p>
              </div>

              {/* 2. SUSUNAN DELEGASI KONTINGEN SNT WILAYAH 2 */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1">
                  2. SUSUNAN KONTINGEN RESMI SNT WILAYAH 2 (4 SISWA & 2 GURU PENDAMPING)
                </h4>
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 text-center w-8">No</th>
                      <th className="p-2 text-left">Nama Lengkap</th>
                      <th className="p-2 text-left">Peran</th>
                      <th className="p-2 text-left">Asal SNT</th>
                      <th className="p-2 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {participants.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="p-2 text-center">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{p.nama}</td>
                        <td className="p-2 text-indigo-900 font-medium">
                          {p.peran === "SISWA" ? "Siswa Peserta Paket A" : "Guru Pendamping Kontingen"}
                        </td>
                        <td className="p-2">{p.sntAsal}</td>
                        <td className="p-2 text-slate-600">{p.peran === "SISWA" ? "-" : (p.sekolahAsal || "-")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-500 italic">
                  *Catatan: Slot Pendamping Kementerian (Kemendikdasmen – bila ada) akan disesuaikan terpisah sesuai penugasan resmi.
                </p>
              </div>

              {/* 3. RUNDOWN KEGIATAN UTAMA (10–15 DESEMBER 2026) */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1">
                  3. JADWAL DETAIL & RUNDOWN KEGIATAN UTAMA (10–15 DESEMBER 2026)
                </h4>
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 text-left w-32">Hari / Tanggal</th>
                      <th className="p-2 text-left w-28">Waktu</th>
                      <th className="p-2 text-left">Rincian Kegiatan</th>
                      <th className="p-2 text-left w-48">Lokasi / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {MAIN_ITINERARY.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-slate-800 whitespace-nowrap">{item.hariTanggal}</td>
                        <td className="p-2 font-semibold text-slate-700 whitespace-nowrap">{item.waktu}</td>
                        <td className="p-2 text-slate-800">{item.kegiatan}</td>
                        <td className="p-2 text-[11px] text-slate-600">{item.lokasiKeterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TANDA TANGAN PENGESAHAN */}
              <div className="pt-6 flex justify-between items-start text-xs">
                <div className="text-center w-64 space-y-14">
                  <p className="text-slate-600 font-semibold">
                    Disusun Oleh,<br />
                    <span className="text-[11px] text-slate-500">{IYRC_INFO.preparedBy.instansi}</span>
                  </p>
                  <div>
                    <p className="font-extrabold text-slate-900 underline text-sm">{IYRC_INFO.preparedBy.nama}</p>
                    <p className="text-slate-500 font-medium text-[11px]">{IYRC_INFO.preparedBy.jabatan}</p>
                  </div>
                </div>
                <div className="text-center w-64 space-y-14">
                  <p className="text-slate-600 font-semibold">
                    Menyetujui,<br />
                    <span className="text-[11px] text-indigo-700 font-bold">Koordinator Wilayah 2 Program SNT</span>
                  </p>
                  <div>
                    <p className="font-extrabold text-slate-900 underline text-sm">{IYRC_INFO.approvedBy.nama}</p>
                    <p className="text-slate-500 font-medium text-[11px]">{IYRC_INFO.approvedBy.jabatan}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINTABLE BUNDLE: PILIHAN DINAMIS (ID / EN / ITINERARY) ==================== */}
      <div id="printable-bundle" className="print-only-container hidden text-slate-900 bg-white">
        {/* DOKUMEN 1: SURAT BAHASA INDONESIA (IZIN PERJALANAN DINAS LUAR NEGERI) */}
        {selectedDocs.id && (
          <div className={`bundle-page ${selectedDocs.en || selectedDocs.itinerary ? "bundle-page-break" : ""}`}>
            <div>
            {/* KOP SURAT RESMI */}
            <div className="border-b-2 border-slate-900 pb-3 mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-wider text-slate-900 uppercase">
                  PT. JULLY TJINDRAWAN ROBOTIK
                </h2>
                <p className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
                  ROBOTIC EXPLORER · OFFICIAL IYRC INDONESIA REPRESENTATIVE · KORWIL 2 SNT
                </p>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">
                  Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510 · info@worldroboticexplorer.com · 0822-9898-4848
                </p>
              </div>
              <div className="text-right border-l-2 border-indigo-600 pl-4 shrink-0">
                <span className="text-xs font-black text-indigo-900 uppercase block">IYRC 2026</span>
                <span className="text-[10px] text-slate-500 font-semibold">Shenzhen, China</span>
              </div>
            </div>

            {/* ISI SURAT BAHASA INDONESIA */}
            <div className="space-y-3.5 text-sm leading-relaxed text-slate-800">
              <div className="flex justify-between text-xs">
                <div>
                  <p>Nomor : <strong>{letterNumber || "......./RE-IYRC/XI/2026"}</strong></p>
                  <p>Lampiran : 1 (satu) Berkas Rencana Anggaran & Jadwal Perjalanan</p>
                  <p>Perihal : <strong>Undangan Resmi & Rekomendasi Izin Perjalanan Dinas Luar Negeri</strong></p>
                </div>
                <div className="text-right">
                  <p>Jakarta, {letterDate}</p>
                </div>
              </div>

              <div className="pt-1">
                <p>Kepada Yth,</p>
                <p className="font-bold text-slate-900">{letterRecipient || `Kepala ${currentLetterParticipant?.sntAsal}`}</p>
                <p>di Tempat</p>
              </div>

              <p className="pt-1">Dengan hormat,</p>
              <p className="text-justify text-xs leading-relaxed">
                Sehubungan dengan terpilihnya {currentLetterParticipant?.peran === "SISWA" ? "putra/putri terbaik" : "pendidik berprestasi"} dari {currentLetterParticipant?.sntAsal} untuk mewakili kontingen Indonesia pada ajang kompetisi robotika dan kecerdasan buatan (AI) tingkat dunia:
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">Nama Acara : The 14th IYRC International Youth Robotics and AI Competition</p>
                <p>Waktu Kegiatan : 12 – 13 Desember 2026 (Periode Perjalanan: 10 – 15 Desember 2026)</p>
                <p>Tempat Pelaksanaan : Longgang International Arts Center, Shenzhen, Republik Rakyat Tiongkok (RRT)</p>
                <p>Akomodasi Hotel : Zhongbao International Hotel (深圳中保国际酒店), Longhua District, Shenzhen</p>
                <p>Penerbangan : China Southern Airlines CZ8056 (11 Des) & CZ8353 (14 Des)</p>
              </div>

              <p className="text-justify text-xs leading-relaxed pt-0.5">
                Bersama ini kami menerbitkan <strong>Surat Undangan Resmi</strong> serta mengajukan permohonan <strong>Izin Perjalanan Dinas Luar Negeri</strong> dan dispensasi {currentLetterParticipant?.peran === "SISWA" ? "belajar/sekolah" : "tugas kedinasan"} kepada yang bersangkutan:
              </p>

              {/* TABEL DATA INDIVIDU SISWA / GURU */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs my-2 bg-white">
                <table className="min-w-full divide-y divide-slate-200">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 bg-slate-50 font-bold text-slate-700 w-1/3">Nama Lengkap</td>
                      <td className="p-2 font-black text-slate-900 uppercase tracking-wide text-sm">
                        {currentLetterParticipant?.nama}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-bold text-slate-700">Peran / Kategori</td>
                      <td className="p-2 font-bold text-indigo-900">
                        {currentLetterParticipant?.peran === "SISWA"
                          ? "Siswa Peserta Kompetisi (Paket A - Robotika & AI)"
                          : "Guru Pendamping & Pembimbing Teknis Kontingen"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-bold text-slate-700">Asal Program SNT</td>
                      <td className="p-2 font-bold text-slate-900">{currentLetterParticipant?.sntAsal}</td>
                    </tr>
                    {currentLetterParticipant?.peran !== "SISWA" && currentLetterParticipant?.sekolahAsal && (
                      <tr>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">Instansi Asal</td>
                        <td className="p-2 font-medium">{currentLetterParticipant?.sekolahAsal}</td>
                      </tr>
                    )}
                    {currentLetterParticipant?.nomorPaspor && (
                      <tr>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">Nomor Paspor</td>
                        <td className="p-2 font-mono">{currentLetterParticipant?.nomorPaspor}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-justify text-xs leading-relaxed">
                Segala persiapan pelatihan intensif (15 November – 9 Desember 2026 di Jakarta), registrasi resmi, dan akomodasi di Shenzhen dikoordinasikan secara penuh di bawah pengawasan PT. Jully Tjindrawan Robotik (Robotic Explorer). Surat ini diterbitkan sebagai dokumen resmi penunjang pengajuan izin dinas luar negeri serta rekomendasi pembuatan dokumen perjalanan (Visa/Paspor).
              </p>

              <p className="text-xs">Demikian surat undangan dan rekomendasi ini kami sampaikan. Atas perhatian, dukungan, dan kerja sama yang baik, kami ucapkan terima kasih.</p>
            </div>
          </div>

          {/* Tanda Tangan */}
          {renderSignatures()}
        </div>
        )}

        {/* DOKUMEN 2: OFFICIAL INVITATION LETTER (ENGLISH) */}
        {selectedDocs.en && (
        <div className={`bundle-page ${selectedDocs.itinerary ? "bundle-page-break" : ""}`}>
          <div>
            {/* KOP SURAT RESMI */}
            <div className="border-b-2 border-slate-900 pb-3 mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-wider text-slate-900 uppercase">
                  PT. JULLY TJINDRAWAN ROBOTIK
                </h2>
                <p className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
                  ROBOTIC EXPLORER · OFFICIAL IYRC INDONESIA REPRESENTATIVE · KORWIL 2 SNT
                </p>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">
                  Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510 · info@worldroboticexplorer.com · 0822-9898-4848
                </p>
              </div>
              <div className="text-right border-l-2 border-indigo-600 pl-4 shrink-0">
                <span className="text-xs font-black text-indigo-900 uppercase block">IYRC 2026</span>
                <span className="text-[10px] text-slate-500 font-semibold">Shenzhen, China</span>
              </div>
            </div>

            {/* ISI SURAT ENGLISH */}
            <div className="space-y-3.5 text-sm leading-relaxed text-slate-800">
              <div className="flex justify-between text-xs">
                <div>
                  <p>Reference No : <strong>{letterNumber || "......./RE-IYRC/XI/2026"}</strong></p>
                  <p>Enclosure : 1 (One) Complete Schedule & Travel Budget Document</p>
                  <p>Subject : <strong>Official Invitation & Clearance Endorsement – The 14th IYRC China 2026</strong></p>
                </div>
                <div className="text-right">
                  <p>Jakarta, {letterDate}</p>
                </div>
              </div>

              <div className="pt-1">
                <p>To Whom It May Concern,</p>
                <p className="font-bold text-slate-900">{letterRecipient || `Head of ${currentLetterParticipant?.sntAsal} & Immigration Authorities`}</p>
                <p>In Indonesia / Embassy of the People's Republic of China</p>
              </div>

              <p className="text-justify text-xs leading-relaxed pt-1">
                This official document serves as a formal confirmation and invitation for the delegate from {currentLetterParticipant?.sntAsal} to attend and compete in <strong>The 14th IYRC International Youth Robotics and AI Competition</strong>, held in Shenzhen, People's Republic of China.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">Event : The 14th IYRC International Youth Robotics and AI Competition</p>
                <p>Date of Competition : December 12–13, 2026 (Travel Period: December 10–15, 2026)</p>
                <p>Venue : Longgang International Arts Center, Shenzhen, China</p>
                <p>Official Hotel : Zhongbao International Hotel (深圳中保国际酒店), No. 21 Donghuan 2nd Rd, Longhua, Shenzhen</p>
                <p>Flight Details : China Southern Airlines CZ8056 (Dec 11, CGK 09:05 → SZX 15:25) / Return CZ8353 (Dec 14, SZX 19:05 → CGK 23:20)</p>
              </div>

              <p className="text-justify text-xs leading-relaxed pt-0.5">
                We proudly certify that the individual named below has been officially selected and endorsed:
              </p>

              {/* TABEL DATA INDIVIDU ENGLISH */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs my-2 bg-white">
                <table className="min-w-full divide-y divide-slate-200">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 bg-slate-50 font-bold text-slate-700 w-1/3">Full Name</td>
                      <td className="p-2 font-black text-slate-900 uppercase tracking-wide text-sm">
                        {currentLetterParticipant?.nama}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-bold text-slate-700">Role / Designation</td>
                      <td className="p-2 font-bold text-indigo-900">
                        {currentLetterParticipant?.peran === "SISWA"
                          ? "Student Competitor (Package A - Robotics & AI)"
                          : "Official Teacher, Coach & Chaperone"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-slate-50 font-bold text-slate-700">SNT Regional Center</td>
                      <td className="p-2 font-bold text-slate-900">{currentLetterParticipant?.sntAsal}</td>
                    </tr>
                    {currentLetterParticipant?.peran !== "SISWA" && currentLetterParticipant?.sekolahAsal && (
                      <tr>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">Institution / Affiliation</td>
                        <td className="p-2 font-medium">{currentLetterParticipant?.sekolahAsal}</td>
                      </tr>
                    )}
                    {currentLetterParticipant?.nomorPaspor && (
                      <tr>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">Passport Number</td>
                        <td className="p-2 font-mono">{currentLetterParticipant?.nomorPaspor}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-justify text-xs leading-relaxed">
                All delegation members will be accommodated and supervised during the event period by Robotic Explorer. We kindly request the Embassy and Immigration authorities to grant the necessary entry visa and international travel clearances.
              </p>

              <p className="text-xs">Thank you for your kind assistance and cooperation.</p>
            </div>
          </div>

          {/* Tanda Tangan */}
          {renderSignatures()}
        </div>
        )}

        {/* DOKUMEN 3: LAMPIRAN ITINERARY & RUNDOWN KEGIATAN LOMBA */}
        {selectedDocs.itinerary && (
        <div className="bundle-page-itinerary space-y-4">
          <div className="text-right text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Lampiran Resmi Surat No: {letterNumber || "......./RE-IYRC/XI/2026"}
          </div>

          {/* KOP SURAT RESMI */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-wider text-slate-900 uppercase">
                PT. JULLY TJINDRAWAN ROBOTIK
              </h2>
              <p className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
                ROBOTIC EXPLORER · OFFICIAL IYRC INDONESIA REPRESENTATIVE · KORWIL 2 SNT
              </p>
              <p className="text-[11px] text-slate-600 mt-1 font-medium">
                Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510 · info@worldroboticexplorer.com · 0822-9898-4848
              </p>
            </div>
            <div className="text-right border-l-2 border-indigo-600 pl-4 shrink-0">
              <span className="text-xs font-black text-indigo-900 uppercase block">IYRC 2026</span>
              <span className="text-[10px] text-slate-500 font-semibold">Shenzhen, China</span>
            </div>
          </div>

          {/* JUDUL DOKUMEN */}
          <div className="text-center space-y-1">
            <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              INFORMASI PERJALANAN DELEGASI & JADWAL KEGIATAN LOMBA (ITINERARY)
            </h1>
            <p className="text-xs font-bold text-indigo-700">
              THE 14th IYRC INTERNATIONAL YOUTH ROBOTICS AND AI COMPETITION 2026
            </p>
            <p className="text-[11px] text-slate-500">
              Lokasi: Longgang International Arts Center, Shenzhen, RRT · Periode Utama: 10 – 15 Desember 2026
            </p>
          </div>

          {/* 1. INFORMASI PENERBANGAN & HOTEL RESMI */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1">
              1. JADWAL PENERBANGAN RESMI & AKOMODASI HOTEL DI SHENZHEN
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-indigo-800 block mb-0.5">🛫 Berangkat (11 Des 2026)</span>
                <p className="font-semibold text-slate-800">China Southern CZ8056</p>
                <p className="text-slate-600 text-[10px]">CGK T3 (09:05) &rarr; SZX T3 (15:25)</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-violet-800 block mb-0.5">🛬 Pulang (14 Des 2026)</span>
                <p className="font-semibold text-slate-800">China Southern CZ8353</p>
                <p className="text-slate-600 text-[10px]">SZX T3 (19:05) &rarr; CGK T3 (23:20)</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-800 block mb-0.5">🏨 Hotel (11–14 Des 2026)</span>
                <p className="font-semibold text-slate-800">Zhongbao Int'l Hotel</p>
                <p className="text-slate-600 text-[10px]">Longhua District, Shenzhen</p>
              </div>
            </div>
          </div>

          {/* 2. SUSUNAN KONTINGEN RESMI SNT WILAYAH 2 */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1">
              2. SUSUNAN KONTINGEN RESMI SNT WILAYAH 2
            </h4>
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-xs">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-1.5 text-center w-8">No</th>
                  <th className="p-1.5 text-left">Nama Lengkap</th>
                  <th className="p-1.5 text-left">Peran</th>
                  <th className="p-1.5 text-left">Asal SNT</th>
                  <th className="p-1.5 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {participants.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="p-1.5 text-center">{idx + 1}</td>
                    <td className="p-1.5 font-bold text-slate-900">{p.nama}</td>
                    <td className="p-1.5 text-indigo-900 font-medium">
                      {p.peran === "SISWA" ? "Siswa Peserta Paket A" : "Guru Pendamping Kontingen"}
                    </td>
                    <td className="p-1.5">{p.sntAsal}</td>
                    <td className="p-1.5 text-slate-600">{p.peran === "SISWA" ? "-" : (p.sekolahAsal || "-")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. RUNDOWN KEGIATAN LENGKAP */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1">
              3. JADWAL DETAIL & RUNDOWN KEGIATAN UTAMA (10–15 DESEMBER 2026)
            </h4>
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-[11px]">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-1.5 text-left w-28">Hari / Tanggal</th>
                  <th className="p-1.5 text-left w-24">Waktu</th>
                  <th className="p-1.5 text-left">Rincian Kegiatan</th>
                  <th className="p-1.5 text-left w-44">Lokasi / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {MAIN_ITINERARY.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5 font-bold text-slate-800 whitespace-nowrap">{item.hariTanggal}</td>
                    <td className="p-1.5 font-semibold text-slate-700 whitespace-nowrap">{item.waktu}</td>
                    <td className="p-1.5 text-slate-800">{item.kegiatan}</td>
                    <td className="p-1.5 text-[10px] text-slate-600">{item.lokasiKeterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TANDA TANGAN PENGESAHAN KORWIL 2 */}
          <div className="pt-4 flex justify-between items-start text-xs">
            <div className="text-center w-64 space-y-12">
              <p className="text-slate-600 font-semibold">
                Disusun Oleh,<br />
                <span className="text-[11px] text-slate-500">{IYRC_INFO.preparedBy.instansi}</span>
              </p>
              <div>
                <p className="font-extrabold text-slate-900 underline text-sm">{IYRC_INFO.preparedBy.nama}</p>
                <p className="text-slate-500 font-medium text-[11px]">{IYRC_INFO.preparedBy.jabatan}</p>
              </div>
            </div>
            <div className="text-center w-64 space-y-12">
              <p className="text-slate-600 font-semibold">
                Menyetujui,<br />
                <span className="text-[11px] text-indigo-700 font-bold">Koordinator Wilayah 2 Program SNT</span>
              </p>
              <div>
                <p className="font-extrabold text-slate-900 underline text-sm">{IYRC_INFO.approvedBy.nama}</p>
                <p className="text-slate-500 font-medium text-[11px]">{IYRC_INFO.approvedBy.jabatan}</p>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* GLOBAL PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* 1. Sembunyikan SEMUA elemen body secara default */
          body * {
            visibility: hidden !important;
          }
          /* 2. Sembunyikan total elemen no-print dan UI layout website */
          .no-print,
          .no-print *,
          nav,
          aside,
          header,
          footer,
          [role="navigation"] {
            display: none !important;
            visibility: hidden !important;
          }

          /* 3. Tampilkan hanya dokumen target cetak surat undangan tunggal */
          body[data-print-target="letter"] #printable-letter,
          body[data-print-target="letter"] #printable-letter * {
            visibility: visible !important;
          }
          body[data-print-target="letter"] #printable-letter {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 9999999 !important;
          }

          /* 4. Tampilkan hanya dokumen target cetak itinerary tunggal */
          body[data-print-target="itinerary"] #printable-itinerary,
          body[data-print-target="itinerary"] #printable-itinerary * {
            visibility: visible !important;
          }
          body[data-print-target="itinerary"] #printable-itinerary {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 9999999 !important;
          }

          /* 5. Tampilkan paket berkas dokumen terpilih */
          body[data-print-target="bundle"] #printable-bundle,
          body[data-print-target="bundle"] #printable-bundle * {
            visibility: visible !important;
          }
          body[data-print-target="bundle"] #printable-bundle {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 9999999 !important;
          }

          .bundle-page {
            min-height: 94vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding-bottom: 20px;
          }
          .bundle-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .bundle-page-itinerary {
            /* Ditampilkan rapi melanjutkan dokumen sebelumnya atau langsung di awal */
          }
        }
      `}</style>
    </div>
  );
}
