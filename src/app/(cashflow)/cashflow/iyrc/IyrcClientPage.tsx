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
} from "lucide-react";
import {
  addIyrcParticipant,
  updateIyrcParticipant,
  deleteIyrcParticipant,
  syncRabToDatabase,
  resetIyrcToDefault,
} from "@/actions/iyrc";
import { calculateDynamicRab } from "@/lib/iyrc-utils";

export default function IyrcClientPage({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState<"rab" | "kontingen" | "itinerary" | "invitation" | "whatsapp">("rab");

  // State Peserta & Budget Items
  const [participants, setParticipants] = useState<any[]>(initialData.participants || []);
  const [budgetItems, setBudgetItems] = useState<any[]>(initialData.budgetItems || []);

  // State Simulasi Dinamis
  const actualSiswaCount = useMemo(() => participants.filter((p) => p.peran === "SISWA").length, [participants]);
  const actualPendampingCount = useMemo(() => participants.filter((p) => p.peran === "GURU_PENDAMPING").length, [participants]);

  const [simSiswa, setSimSiswa] = useState<number>(actualSiswaCount);
  const [simPendamping, setSimPendamping] = useState<number>(actualPendampingCount);
  const [isApplyingSim, setIsApplyingSim] = useState(false);

  // Kalkulasi Simulasi RAB (Real-time)
  const currentSimulation = useMemo(() => {
    return calculateDynamicRab(simSiswa, simPendamping, budgetItems);
  }, [simSiswa, simPendamping, budgetItems]);

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
  const [letterDate, setLetterDate] = useState<string>("10 November 2026");
  const [showItineraryPrintModal, setShowItineraryPrintModal] = useState<boolean>(false);
  const [showLetterPrintModal, setShowLetterPrintModal] = useState<boolean>(false);

  // Penandatangan Dinamis: Default Koordinator Wilayah 2 (Jully Tjindrawan) di sebelah KANAN
  const [signatories, setSignatories] = useState<Array<{ nama: string; jabatan: string; instansi: string }>>([
    {
      nama: "Jully Tjindrawan, MBA",
      jabatan: "Koordinator Wilayah 2 Program SNT",
      instansi: "PT Jully Tjindrawan Robotik (Robotic Explorer)",
    },
  ]);

  // Sync tujuan surat otomatis dengan asal SNT peserta yang dipilih
  useEffect(() => {
    const p = participants.find((item) => item.id === selectedLetterParticipant);
    if (p) {
      setLetterRecipient(`Kepala ${p.sntAsal}`);
    }
  }, [selectedLetterParticipant, participants]);

  // Handler Print Khusus (Surat Undangan atau Itinerary)
  const handlePrintLetter = () => {
    document.body.setAttribute("data-print-target", "letter");
    window.print();
    setTimeout(() => {
      document.body.removeAttribute("data-print-target");
    }, 1000);
  };

  const handlePrintItinerary = () => {
    document.body.setAttribute("data-print-target", "itinerary");
    window.print();
    setTimeout(() => {
      document.body.removeAttribute("data-print-target");
    }, 1000);
  };

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
    if (!confirm("Kembalikan data peserta dan RAB ke kondisi awal PDF (3 Siswa & 2 Guru Pendamping)?")) return;
    setIsSubmitting(true);
    try {
      await resetIyrcToDefault();
      alert("Data berhasil direset ke default PDF!");
      window.location.reload();
    } catch (err: any) {
      alert("Gagal mereset: " + err.message);
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

  // Handler Simpan Status Pembayaran
  const handleSavePayment = async () => {
    if (!selectedParticipant) return;
    setIsSubmitting(true);
    try {
      await updateIyrcParticipant(selectedParticipant.id, {
        statusPembayaran: paymentForm.statusPembayaran,
        nominalTerbayar: Number(paymentForm.nominalTerbayar) || 0,
        catatan: paymentForm.catatan,
      });
      setShowEditPaymentModal(false);
      window.location.reload();
    } catch (err: any) {
      alert("Gagal memperbarui pembayaran: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Export CSV RAB
  const handleExportCsv = () => {
    const headers = ["Kode", "Kategori", "Uraian", "Volume", "Satuan", "Harga Satuan", "Tanggungan Robotic Explorer", "Tanggungan Peserta / SNT", "Keterangan"];
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

  // Salin Pesan WhatsApp
  const handleCopyWhatsApp = async () => {
    const text = `Yth. Bapak/Ibu Guru Pendamping & Orang Tua Siswa SNT,

Berikut kami sampaikan rincian informasi dan jadwal keikutsertaan kontingen pada *The 14th IYRC International Youth Robotics and AI Competition 2026 (Shenzhen, China)*:

📍 *1. JADWAL PENERBANGAN (FLIGHT DETAILS)*
• *Keberangkatan:* Jumat, 11 Desember 2026
  China Southern Airlines CZ8056
  Rute: Jakarta (CGK T3) 09.05 → Shenzhen (SZX T3) 15.25 (Airbus A320neo)
• *Kepulangan:* Selasa, 15 Desember 2026
  China Southern Airlines (Estimasi CZ8353)
  Rute: Shenzhen (SZX) 19.05 → Jakarta (CGK) 23.20
• *Penerbangan Domestik:* Tiba di Jakarta tgl 10 Des; dan terbang kembali ke daerah asal tgl 16 Des 2026.

🏨 *2. AKOMODASI & HOTEL*
• *11–14 Des 2026 (4H3M):* Hotel Paket resmi IYRC di Shenzhen (sudah termasuk sarapan & makan harian).
• *14–15 Des 2026 (1 Malam):* Hotel di luar paket di pusat kota Shenzhen (untuk istirahat sebelum penerbangan pulang tgl 15 malam).

🗓️ *3. ITINERARY KEGIATAN PER HARI*
• *10 Des (Kam):* Keberangkatan dari daerah asal (Tidore/Kupang/Tanjabtim) menuju Jakarta (Bandara Soetta).
• *11 Des (Jum):* Penerbangan CGK → SZX, check-in hotel dan registrasi kontingen.
• *12–13 Des (Sab-Min):* Pelaksanaan Kompetisi IYRC 2026 di Longgang International Arts Center, Shenzhen.
• *14 Des (Sen):* Paket kompetisi selesai; sesi kunjungan edukatif / robotika Shenzhen, check-in hotel tambahan.
• *15 Des (Sel):* Check-out hotel, transfer bandara SZX, penerbangan malam menuju Jakarta (tiba 23.20 WIB).
• *16 Des (Rab):* Penerbangan lanjutan langsung kembali ke daerah asal masing-masing.

📑 *4. TIMELINE & PENGURUSAN VISA CHINA*
• *Waktu Pengurusan:* Disarankan diproses pada rentang *25 Oktober s.d. 15 November 2026* (±30 hari sebelum keberangkatan).
• *Persyaratan Wajib:*
  1. Paspor asli dengan masa berlaku minimal 6 bulan saat keberangkatan (min. Juni 2027).
  2. Pasfoto resmi latar putih (33mm x 48mm).
  3. Surat Undangan Resmi (*Invitation Letter*) dari penyelenggara.
  4. Tiket penerbangan & konfirmasi hotel (disediakan tim).
• *Pilihan Pengurusan:* Jalur standar online (±Rp 974.000) atau via Agen Visa Resmi (±Rp 1.600.000/orang).

✉️ *5. SURAT UNDANGAN RESMI (INVITATION LETTER)*
Surat undangan resmi berkop Robotic Explorer & IYRC atas nama siswa yang bersangkutan sudah diterbitkan oleh pihak kami sebagai dasar permohonan *Izin Perjalanan Dinas Luar Negeri* ke Pemda / Dinas Pendidikan / Sekolah.

Demikian kami sampaikan. Jika ada hal yang ingin dikoordinasikan lebih lanjut, kami siap membantu. Terima kasih atas dukungan Bapak/Ibu! 🙏🤖`;

    try {
      await navigator.clipboard.writeText(text);
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-indigo-200">
              <Sparkles size={13} className="text-amber-300" /> The 14th International Youth Robotics and AI Competition
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              IYRC China 2026 – Shenzhen
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Longgang International Arts Center, Shenzhen · Kompetisi 12–13 Desember 2026 (Kontingen SNT Wilayah 2)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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
              title="Kembalikan ke data awal 3 siswa & 2 guru"
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
            <Users size={15} /> Kontingen & Status Peserta ({participants.length})
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
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Calculator size={18} />
                <span>Panel Simulasi Dinamis Peserta & Pendamping</span>
                {(simSiswa !== actualSiswaCount || simPendamping !== actualPendampingCount) && (
                  <span className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                    Mode Simulasi Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Ubah jumlah siswa atau pendamping untuk melihat simulasi kalkulasi otomatis seluruh pos anggaran RAB secara langsung.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
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

              {/* Action Buttons */}
              <button
                onClick={handleApplySimulation}
                disabled={isApplyingSim || (simSiswa === actualSiswaCount && simPendamping === actualPendampingCount)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} /> Simpan Simulasi ke RAB
              </button>

              {(simSiswa !== actualSiswaCount || simPendamping !== actualPendampingCount) && (
                <button
                  onClick={() => {
                    setSimSiswa(actualSiswaCount);
                    setSimPendamping(actualPendampingCount);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Batal
                </button>
              )}
            </div>
          </div>

          {/* 4 SUMMARY STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-indigo-600 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                  Tanggungan Robotic Explorer
                  <Building size={16} className="text-indigo-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-indigo-700">
                  {formatCurrency(currentSimulation.totalTanggunganRobotic)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Biaya Paket Kompetisi ({simSiswa} Siswa + {simPendamping} Pendamping)
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                  Tanggungan Peserta / SNT
                  <Users size={16} className="text-rose-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-rose-600">
                  {formatCurrency(currentSimulation.totalTanggunganPeserta)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Perjalanan, Dokumen, Tiket CZ8056, Visa ({currentSimulation.totalPersonel} Orang)
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                  Beban Per Siswa
                  <Sparkles size={16} className="text-emerald-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-emerald-700">
                  {formatCurrency(currentSimulation.biayaPerSiswa)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kompetisi {formatCurrency(30000000)} + Tiket/Visa {formatCurrency(currentSimulation.perPersonTravelFee)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-violet-600 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                  Beban Per Guru Pendamping
                  <Users size={16} className="text-violet-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-extrabold text-violet-700">
                  {formatCurrency(currentSimulation.biayaPerPendamping)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Paket {formatCurrency(12000000)} + Tiket/Visa {formatCurrency(currentSimulation.perPersonTravelFee)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* DETAIL RAB TABLE */}
          <Card className="shadow-sm overflow-hidden border border-slate-200">
            <CardHeader className="border-b bg-slate-50/70 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Rincian Anggaran Biaya (RAB) Lengkap – Bagian A s.d. E
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulasi Komposisi: {simSiswa} Siswa (Paket A) + {simPendamping} Guru Pendamping
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Keseluruhan:</span>
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
                      <th className="px-5 py-3 text-left w-12">No</th>
                      <th className="px-5 py-3 text-left">Uraian Biaya</th>
                      <th className="px-5 py-3 text-center">Vol</th>
                      <th className="px-5 py-3 text-center">Satuan</th>
                      <th className="px-5 py-3 text-right">Harga Satuan</th>
                      <th className="px-5 py-3 text-right bg-indigo-50/60 text-indigo-900">Tanggungan Robotic Explorer</th>
                      <th className="px-5 py-3 text-right bg-rose-50/60 text-rose-900">Di Luar Tanggungan (Peserta/SNT)</th>
                      <th className="px-5 py-3 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentSimulation.items.map((item: any, idx: number) => {
                      const isFirstOfCategory = idx === 0 || item.kategori !== currentSimulation.items[idx - 1].kategori;
                      return (
                        <tr key={item.code} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">{item.code}</td>
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {item.uraian}
                            {isFirstOfCategory && (
                              <span className="block text-[10px] uppercase font-bold text-indigo-600 mt-0.5">
                                Pos {item.kategori} · {item.namaKategori}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-700">{item.volume}</td>
                          <td className="px-5 py-3 text-center text-xs text-slate-500">{item.satuan}</td>
                          <td className="px-5 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {formatCurrency(item.hargaSatuan)}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-indigo-700 bg-indigo-50/20 whitespace-nowrap">
                            {item.tanggunganRobotic > 0 ? formatCurrency(item.tanggunganRobotic) : "-"}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-rose-600 bg-rose-50/20 whitespace-nowrap">
                            {item.tanggunganPeserta > 0 ? formatCurrency(item.tanggunganPeserta) : "-"}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500 max-w-xs">{item.keterangan || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-extrabold text-slate-900 text-sm">
                    <tr>
                      <td colSpan={5} className="px-5 py-4 text-right uppercase tracking-wider">
                        Total Anggaran:
                      </td>
                      <td className="px-5 py-4 text-right text-indigo-700 bg-indigo-100/60">
                        {formatCurrency(currentSimulation.totalTanggunganRobotic)}
                      </td>
                      <td className="px-5 py-4 text-right text-rose-700 bg-rose-100/60">
                        {formatCurrency(currentSimulation.totalTanggunganPeserta)}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                        Total: {formatCurrency(currentSimulation.totalKeseluruhan)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
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
              <h2 className="text-xl font-bold text-slate-900">Daftar Kontingen & Status Pembayaran</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola nama siswa dan guru pendamping, nomor paspor/NISN, serta monitoring pelunasan biaya perjalanan.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 self-start"
            >
              <Plus size={16} /> Tambah Peserta / Pendamping
            </button>
          </div>

          <Card className="shadow-sm overflow-hidden border border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 text-left">Nama Peserta</th>
                      <th className="px-5 py-3.5 text-center">Peran</th>
                      <th className="px-5 py-3.5 text-left">SNT & Sekolah Asal</th>
                      <th className="px-5 py-3.5 text-right">Biaya Kompetisi</th>
                      <th className="px-5 py-3.5 text-right">Tiket & Visa (Beban SNT)</th>
                      <th className="px-5 py-3.5 text-center">Status Bayar</th>
                      <th className="px-5 py-3.5 text-right">Terbayar</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {participants.map((p) => {
                      const sisa = p.biayaPerjalananVisa - (p.nominalTerbayar || 0);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                            {p.nama}
                            <div className="text-xs font-normal text-slate-400 mt-0.5">
                              Paspor: {p.nomorPaspor || "Belum ada"} · NISN/NIP: {p.nisnOrNip || "-"}
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
                          <td className="px-5 py-4 text-right font-semibold text-slate-700 whitespace-nowrap">
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
                                    statusPembayaran: p.statusPembayaran || "BELUM_LUNAS",
                                    nominalTerbayar: p.nominalTerbayar || 0,
                                    catatan: p.catatan || "",
                                  });
                                  setShowEditPaymentModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="Edit Status Pembayaran"
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

      {/* ==================== TAB 3: ITINERARY, PENERBANGAN & VISA ==================== */}
      {activeTab === "itinerary" && (
        <div className="space-y-6">
          {/* HEADER ACTION BANNER */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" /> Rencana Perjalanan & Jadwal Kegiatan Lomba
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rundown lengkap penerbangan (CZ8056 & CZ8353), hotel, venue kompetisi di Longgang Shenzhen, dan timeline harian kontingen.
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

          {/* FLIGHT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-indigo-200 shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
              <CardHeader className="pb-3 border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-full">
                    Penerbangan Berangkat
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Jumat, 11 Des 2026</span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
                  <Plane size={18} className="text-indigo-600 rotate-45" /> China Southern CZ8056
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div>
                    <div className="text-xl font-extrabold text-indigo-700">09.05 WIB</div>
                    <div className="text-xs text-slate-500">Jakarta (CGK) · T3</div>
                  </div>
                  <ArrowRight size={20} className="text-indigo-400" />
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-indigo-700">15.25 CST</div>
                    <div className="text-xs text-slate-500">Shenzhen (SZX) · T3</div>
                  </div>
                </div>
                <div className="pt-2 text-xs text-slate-500 border-t border-indigo-100 flex items-center justify-between">
                  <span>Pesawat: Airbus A320neo</span>
                  <span>Durasi: ±5 Jam 20 Menit</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-violet-200 shadow-sm bg-gradient-to-br from-white to-violet-50/30">
              <CardHeader className="pb-3 border-b border-violet-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-100/70 px-2.5 py-1 rounded-full">
                    Penerbangan Kepulangan
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Selasa, 15 Des 2026</span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
                  <Plane size={18} className="text-violet-600 -rotate-45" /> China Southern CZ8353 (Estimasi)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div>
                    <div className="text-xl font-extrabold text-violet-700">19.05 CST</div>
                    <div className="text-xs text-slate-500">Shenzhen (SZX)</div>
                  </div>
                  <ArrowRight size={20} className="text-violet-400" />
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-violet-700">23.20 WIB</div>
                    <div className="text-xs text-slate-500">Jakarta (CGK) · T3</div>
                  </div>
                </div>
                <div className="pt-2 text-xs text-slate-500 border-t border-violet-100 flex items-center justify-between">
                  <span>Penerbangan Malam Langsung</span>
                  <span>Lanjut terbang ke SNT asal tgl 16 Des</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ITINERARY TIMELINE */}
          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="border-b bg-slate-50/60 py-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" /> Rencana Perjalanan Lengkap (10–16 Desember 2026)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative border-l-2 border-indigo-200 ml-4 space-y-8">
                <div className="relative pl-6">
                  <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">10 Des 2026 (Kamis)</span>
                    <span className="text-xs font-semibold text-slate-500">Perjalanan Domestik</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">Terbang dari Daerah Asal ke Jakarta</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Peserta dan guru pendamping terbang dari bandara asal (Tidore via Ternate, Kupang, Tanjung Jabung Timur via Jambi) menuju Bandara Soekarno-Hatta (CGK). Langsung berkumpul di Jakarta tanpa menginap.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white shadow-sm" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">11 Des 2026 (Jumat)</span>
                    <span className="text-xs font-semibold text-emerald-700 font-bold">Menginap di Hotel Paket</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">Penerbangan Jakarta → Shenzhen & Registrasi</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Pukul 09.05 WIB terbang dengan CZ8056 menuju Shenzhen (tiba 15.25 CST). Penjemputan van bandara menuju hotel resmi kompetisi, check-in, dan pengambilan kit registrasi peserta.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-amber-500 border-4 border-white shadow-sm" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">12–13 Des 2026 (Sabtu–Minggu)</span>
                    <span className="text-xs font-semibold text-amber-700 font-bold">Menginap di Hotel Paket</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">Pelaksanaan The 14th IYRC China 2026</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Kompetisi Robotika dan AI bertaraf internasional di Longgang International Arts Center, Shenzhen. Presentasi karya, pertandingan, serta awarding ceremony.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-violet-600 border-4 border-white shadow-sm" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded">14 Des 2026 (Senin)</span>
                    <span className="text-xs font-semibold text-violet-700 font-bold">Menginap di Hotel Shenzhen (Luar Paket)</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">Paket Selesai & Hari Eksplorasi Edukatif</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Paket resmi berakhir. Kontingen check-out dan pindah ke hotel di pusat kota Shenzhen (3 kamar). Agenda bebas terarah untuk eksplorasi teknologi dan ekosistem inovasi Shenzhen.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">15–16 Des 2026 (Selasa–Rabu)</span>
                    <span className="text-xs font-semibold text-slate-500">Perjalanan Pulang</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">Penerbangan Shenzhen → Jakarta → Daerah Asal</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Pukul 19.05 CST terbang kembali dengan CZ8353 menuju Jakarta (tiba 23.20 WIB). Pada 16 Desember pagi langsung melanjutkan penerbangan ke bandara daerah asal masing-masing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VISA APPLICATION GUIDE */}
          <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-amber-200">
              <CardTitle className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-600" /> Panduan & Jadwal Pengurusan Visa China
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-amber-950">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm">
                  <span className="font-bold text-amber-800 block mb-1">⏱️ Waktu Pengurusan:</span>
                  20 Oktober – 10 November 2026 (30–45 hari sebelum jadwal keberangkatan 11 Des).
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm">
                  <span className="font-bold text-amber-800 block mb-1">📋 Dokumen Wajib:</span>
                  Paspor (berlaku min. 6 bulan), Pasfoto 33x48mm latar putih, Surat Undangan resmi (Invitation Letter), Tiket & Hotel.
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm">
                  <span className="font-bold text-amber-800 block mb-1">💰 Opsi Pengurusan:</span>
                  Jalur standar online (Rp 974.000) atau via Agen Pengurusan Visa (Rp 1.600.000/orang).
                </div>
              </div>
            </CardContent>
          </Card>
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
                  <Printer size={16} /> Cetak / Download PDF Surat
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
                  <p>Waktu Kegiatan : 12 – 13 Desember 2026 (Periode Perjalanan: 10 – 16 Desember 2026)</p>
                  <p>Tempat Pelaksanaan : Longgang International Arts Center, Shenzhen, Republik Rakyat Tiongkok (RRT)</p>
                  <p>Penerbangan : China Southern Airlines CZ8056 (Jakarta–Shenzhen PP)</p>
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
                  Segala persiapan pelatihan intensif, registrasi resmi, dan akomodasi di Shenzhen dikoordinasikan secara penuh di bawah pengawasan PT. Jully Tjindrawan Robotik (Robotic Explorer). Surat ini diterbitkan sebagai dokumen resmi penunjang pengajuan izin dinas luar negeri serta rekomendasi pembuatan dokumen perjalanan (Visa/Paspor).
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
                  <p>Date of Competition : December 12–13, 2026 (Travel Period: December 10–16, 2026)</p>
                  <p>Venue : Longgang International Arts Center, Shenzhen, China</p>
                  <p>Flight Details : China Southern Airlines CZ8056 (CGK 09:05 → SZX 15:25) / Return CZ8353</p>
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
            {signatories.length === 1 ? (
              <div className="pt-10 flex justify-end">
                <div className="text-center w-64 space-y-16">
                  <p className="text-slate-600 font-semibold text-xs">{signatories[0].instansi}</p>
                  <div>
                    <p className="font-extrabold text-slate-900 underline text-sm">{signatories[0].nama}</p>
                    <p className="text-slate-500 font-medium text-[11px]">{signatories[0].jabatan}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-10 flex justify-between items-start">
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
            )}
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
                  <Share2 size={18} className="text-emerald-600" /> Teks Balasan WhatsApp Siap Kirim (1-Klik Salin)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teks ini telah disusun menjawab langsung 5 poin pertanyaan wali murid / guru pendamping pada tangkapan layar chat.
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
{`Yth. Bapak/Ibu Guru Pendamping & Orang Tua Siswa SNT,

Berikut kami sampaikan rincian informasi dan jadwal keikutsertaan kontingen pada *The 14th IYRC International Youth Robotics and AI Competition 2026 (Shenzhen, China)*:

📍 *1. JADWAL PENERBANGAN (FLIGHT DETAILS)*
• *Keberangkatan:* Jumat, 11 Desember 2026
  China Southern Airlines CZ8056
  Rute: Jakarta (CGK T3) 09.05 → Shenzhen (SZX T3) 15.25 (Airbus A320neo)
• *Kepulangan:* Selasa, 15 Desember 2026
  China Southern Airlines (Estimasi CZ8353)
  Rute: Shenzhen (SZX) 19.05 → Jakarta (CGK) 23.20
• *Penerbangan Domestik:* Tiba di Jakarta tgl 10 Des; dan terbang kembali ke daerah asal tgl 16 Des 2026.

🏨 *2. AKOMODASI & HOTEL*
• *11–14 Des 2026 (4H3M):* Hotel Paket resmi IYRC di Shenzhen (sudah termasuk sarapan & makan harian).
• *14–15 Des 2026 (1 Malam):* Hotel di luar paket di pusat kota Shenzhen (untuk istirahat sebelum penerbangan pulang tgl 15 malam).

🗓️ *3. ITINERARY KEGIATAN PER HARI*
• *10 Des (Kam):* Keberangkatan dari daerah asal (Tidore/Kupang/Tanjabtim) menuju Jakarta (Bandara Soetta).
• *11 Des (Jum):* Penerbangan CGK → SZX, check-in hotel dan registrasi kontingen.
• *12–13 Des (Sab-Min):* Pelaksanaan Kompetisi IYRC 2026 di Longgang International Arts Center, Shenzhen.
• *14 Des (Sen):* Paket kompetisi selesai; sesi kunjungan edukatif / robotika Shenzhen, check-in hotel tambahan.
• *15 Des (Sel):* Check-out hotel, transfer bandara SZX, penerbangan malam menuju Jakarta (tiba 23.20 WIB).
• *16 Des (Rab):* Penerbangan lanjutan langsung kembali ke daerah asal masing-masing.

📑 *4. TIMELINE & PENGURUSAN VISA CHINA*
• *Waktu Pengurusan:* Disarankan diproses pada rentang *25 Oktober s.d. 15 November 2026* (±30 hari sebelum keberangkatan).
• *Persyaratan Wajib:*
  1. Paspor asli dengan masa berlaku minimal 6 bulan saat keberangkatan (min. Juni 2027).
  2. Pasfoto resmi latar putih (33mm x 48mm).
  3. Surat Undangan Resmi (*Invitation Letter*) dari penyelenggara.
  4. Tiket penerbangan & konfirmasi hotel (disediakan tim).
• *Pilihan Pengurusan:* Jalur standar online (±Rp 974.000) atau via Agen Visa Resmi (±Rp 1.600.000/orang).

✉️ *5. SURAT UNDANGAN RESMI (INVITATION LETTER)*
Surat undangan resmi berkop Robotic Explorer & IYRC atas nama siswa yang bersangkutan sudah diterbitkan oleh pihak kami sebagai dasar permohonan *Izin Perjalanan Dinas Luar Negeri* ke Pemda / Dinas Pendidikan / Sekolah.

Demikian kami sampaikan. Jika ada hal yang ingin dikoordinasikan lebih lanjut, kami siap membantu. Terima kasih atas dukungan Bapak/Ibu! 🙏🤖`}
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
                    placeholder="Contoh: SNT 10 Kupang"
                    className="w-full border-slate-300 rounded-xl border p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sekolah / Instansi Asal:</label>
                <input
                  type="text"
                  value={newParticipant.sekolahAsal}
                  onChange={(e) => setNewParticipant({ ...newParticipant, sekolahAsal: e.target.value })}
                  placeholder="Contoh: SMP Negeri 1 Kupang"
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

      {/* ==================== MODAL EDIT STATUS PEMBAYARAN ==================== */}
      {showEditPaymentModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Pembayaran Peserta</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedParticipant.nama}</p>
              </div>
              <button onClick={() => setShowEditPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Beban Mandiri Peserta (Tiket & Visa):</span>
                <span className="text-base font-extrabold text-rose-600">
                  {formatCurrency(selectedParticipant.biayaPerjalananVisa)}
                </span>
              </div>

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

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Catatan Pembayaran:</label>
                <textarea
                  value={paymentForm.catatan}
                  onChange={(e) => setPaymentForm({ ...paymentForm, catatan: e.target.value })}
                  rows={2}
                  placeholder="Catatan transfer, bank, atau bukti bayar..."
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL PENGISIAN NOMOR SURAT & KONFIRMASI CETAK ==================== */}
      {showLetterPrintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Printer size={18} className="text-indigo-600" /> Cetak Surat Undangan Resmi
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

            <div className="space-y-3.5 text-xs">
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
                  *Nomor surat ini akan langsung dicetak pada kop surat resmi.
                </p>
              </div>

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
                <label className="block text-slate-700 font-bold mb-1">Tujuan Surat (Kepada Yth):</label>
                <input
                  type="text"
                  value={letterRecipient}
                  onChange={(e) => setLetterRecipient(e.target.value)}
                  placeholder={`Kepala ${currentLetterParticipant?.sntAsal}`}
                  className="w-full border-slate-300 rounded-xl border p-2 text-xs text-slate-800 font-semibold"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Otomatis disesuaikan ke Kepala {currentLetterParticipant?.sntAsal}
                </p>
              </div>

              {/* Bahasa Surat */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Bahasa Dokumen:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLetterLanguage("id")}
                    className={`p-2 rounded-xl text-xs font-bold border text-center transition-all ${
                      letterLanguage === "id"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Bahasa Indonesia
                  </button>
                  <button
                    type="button"
                    onClick={() => setLetterLanguage("en")}
                    className={`p-2 rounded-xl text-xs font-bold border text-center transition-all ${
                      letterLanguage === "en"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    English
                  </button>
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
                  onClick={() => {
                    setShowLetterPrintModal(false);
                    setTimeout(() => {
                      handlePrintLetter();
                    }, 250);
                  }}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Printer size={14} /> Lanjut Cetak / Unduh PDF
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
                  RENCANA PERJALANAN DETAIL & JADWAL KEGIATAN LOMBA (ITINERARY)
                </h1>
                <p className="text-xs font-bold text-indigo-700">
                  THE 14th IYRC INTERNATIONAL YOUTH ROBOTICS AND AI COMPETITION 2026
                </p>
                <p className="text-[11px] text-slate-500">
                  Lokasi: Longgang International Arts Center, Shenzhen, RRT · Periode: 10 – 16 Desember 2026
                </p>
              </div>

              {/* 1. INFORMASI PENERBANGAN RESMI */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1">
                  1. JADWAL PENERBANGAN RESMI (FLIGHT SCHEDULE)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-indigo-800 block mb-1">🛫 Penerbangan Berangkat (Jumat, 11 Des 2026)</span>
                    <p className="font-semibold text-slate-800">China Southern Airlines CZ8056</p>
                    <p className="text-slate-600 text-[11px]">Jakarta (CGK Terminal 3) 09:05 WIB &rarr; Shenzhen (SZX Terminal 3) 15:25 CST</p>
                    <p className="text-[10px] text-slate-500">Pesawat: Airbus A320neo · Bagasi Terdaftar: 23 kg / orang</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-violet-800 block mb-1">🛬 Penerbangan Kepulangan (Selasa, 15 Des 2026)</span>
                    <p className="font-semibold text-slate-800">China Southern Airlines CZ8353 (Estimasi)</p>
                    <p className="text-slate-600 text-[11px]">Shenzhen (SZX) 19:05 CST &rarr; Jakarta (CGK Terminal 3) 23:20 WIB</p>
                    <p className="text-[10px] text-slate-500">Penerbangan Malam Langsung · Tiba di Jakarta 23:20 WIB</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  *Catatan Domestik: Seluruh peserta daerah tiba di Jakarta pada 10 Des 2026 dan terbang kembali ke daerah asal pada 16 Des 2026.
                </p>
              </div>

              {/* 2. SUSUNAN DELEGASI KONTINGEN SNT WILAYAH 2 */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1">
                  2. SUSUNAN KONTINGEN RESMI SNT WILAYAH 2
                </h4>
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 text-center w-8">No</th>
                      <th className="p-2 text-left">Nama Lengkap</th>
                      <th className="p-2 text-left">Peran</th>
                      <th className="p-2 text-left">Asal SNT</th>
                      <th className="p-2 text-left">Sekolah / Instansi</th>
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
              </div>

              {/* 3. RUNDOWN KEGIATAN LENGKAP HARI DEMI HARI */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1">
                  3. JADWAL DETAIL & RUNDOWN KEGIATAN LOMBA (10–16 DESEMBER 2026)
                </h4>
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 text-left w-28">Tanggal & Hari</th>
                      <th className="p-2 text-left w-24">Waktu</th>
                      <th className="p-2 text-left">Rincian Agenda & Lokasi Kegiatan</th>
                      <th className="p-2 text-left w-36">Keterangan / Dresscode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-2 font-bold text-slate-800" rowSpan={3}>
                        10 Des 2026<br /><span className="text-[10px] text-slate-500 font-normal">Kamis</span>
                      </td>
                      <td className="p-2 font-semibold">08:00 – 16:00</td>
                      <td className="p-2">
                        Penerbangan domestik delegasi dari bandara daerah asal (Kupang KOE, Tidore via Ternate TTE, Tanjabtim via Jambi DJB) menuju Bandara Soekarno-Hatta (CGK) Jakarta.
                      </td>
                      <td className="p-2 text-[11px] text-slate-600">Pakaian bebas rapi / jaket perjalanan</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">17:00 – 19:00</td>
                      <td className="p-2">
                        Pertemuan koordinasi delegasi di area Terminal 3 CGK, pengecekan akhir kit robot CodeSpark 3 Creator & kelengkapan paspor, visa, dan asuransi.
                      </td>
                      <td className="p-2 text-[11px] text-slate-600">Briefing teknis Korwil 2</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">20:00 – Selesai</td>
                      <td className="p-2">Istirahat transit di hotel bandara Soetta tanpa keluar area bandara.</td>
                      <td className="p-2 text-[11px] text-slate-600">Istirahat optimal</td>
                    </tr>

                    <tr className="bg-slate-50/50">
                      <td className="p-2 font-bold text-indigo-900" rowSpan={4}>
                        11 Des 2026<br /><span className="text-[10px] text-slate-500 font-normal">Jumat</span>
                      </td>
                      <td className="p-2 font-semibold">06:00 – 08:00</td>
                      <td className="p-2">Check-in penerbangan internasional China Southern Airlines CZ8056 di T3 CGK, drop bagasi, dan proses imigrasi Indonesia.</td>
                      <td className="p-2 text-[11px] text-slate-600">Seragam Kontingen SNT Indonesia</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2 font-semibold">09:05 – 15:25</td>
                      <td className="p-2">Penerbangan langsung Jakarta (CGK) menuju Shenzhen (SZX). Durasi penerbangan ±5 jam 20 menit.</td>
                      <td className="p-2 text-[11px] text-slate-600">Flight CZ8056</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2 font-semibold">15:25 – 17:30</td>
                      <td className="p-2">Mendarat di Shenzhen Bao'an (SZX T3), proses imigrasi RRT, klaim bagasi, dan penjemputan van delegasi menuju hotel resmi kompetisi.</td>
                      <td className="p-2 text-[11px] text-slate-600">Van jemputan resmi</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2 font-semibold">18:00 – 21:00</td>
                      <td className="p-2">Check-in hotel paket resmi IYRC Longgang, pengambilan ID card resmi, verifikasi nomor peserta, makan malam, dan uji coba robot.</td>
                      <td className="p-2 text-[11px] text-slate-600">Hotel Paket IYRC (Malam 1)</td>
                    </tr>

                    <tr className="bg-amber-50/30">
                      <td className="p-2 font-bold text-amber-900" rowSpan={4}>
                        12 Des 2026<br /><span className="text-[10px] text-amber-700 font-bold">Sabtu (Lomba 1)</span>
                      </td>
                      <td className="p-2 font-semibold">07:00 – 08:30</td>
                      <td className="p-2">Sarapan pagi di hotel dan transfer menuju venue <strong>Longgang International Arts Center</strong>.</td>
                      <td className="p-2 text-[11px] text-slate-600">Membawa Robot Kit & Toolkit</td>
                    </tr>
                    <tr className="bg-amber-50/30">
                      <td className="p-2 font-semibold">09:00 – 10:30</td>
                      <td className="p-2"><strong>Opening Ceremony The 14th IYRC China 2026</strong>, parade kontingen negara, dan sambutan komite internasional.</td>
                      <td className="p-2 text-[11px] text-slate-600">Seragam Resmi Kontingen</td>
                    </tr>
                    <tr className="bg-amber-50/30">
                      <td className="p-2 font-semibold">10:30 – 16:30</td>
                      <td className="p-2">
                        <strong>Babak Penyisihan & Penjurian Proyek:</strong> Pertandingan kategori Creative Robot, AI Challenge, dan Coding Robot. Presentasi karya di hadapan dewan juri internasional.
                      </td>
                      <td className="p-2 text-[11px] text-slate-600">Makan siang disediakan di venue</td>
                    </tr>
                    <tr className="bg-amber-50/30">
                      <td className="p-2 font-semibold">17:30 – 20:30</td>
                      <td className="p-2">Penutupan sesi hari ke-1, transfer kembali ke hotel, evaluasi teknis robot oleh guru pendamping, dan makan malam.</td>
                      <td className="p-2 text-[11px] text-slate-600">Hotel Paket IYRC (Malam 2)</td>
                    </tr>

                    <tr className="bg-emerald-50/30">
                      <td className="p-2 font-bold text-emerald-900" rowSpan={4}>
                        13 Des 2026<br /><span className="text-[10px] text-emerald-700 font-bold">Minggu (Lomba 2)</span>
                      </td>
                      <td className="p-2 font-semibold">07:00 – 08:30</td>
                      <td className="p-2">Sarapan pagi di hotel dan transfer kontingen ke Longgang International Arts Center.</td>
                      <td className="p-2 text-[11px] text-slate-600">Seragam Kontingen Indonesia</td>
                    </tr>
                    <tr className="bg-emerald-50/30">
                      <td className="p-2 font-semibold">09:00 – 12:30</td>
                      <td className="p-2"><strong>Babak Final & Grand Exhibition:</strong> Demonstrasi final karya peserta terbaik dan pameran inovasi robotika dunia.</td>
                      <td className="p-2 text-[11px] text-slate-600">Sesi Penjurian Final</td>
                    </tr>
                    <tr className="bg-emerald-50/30">
                      <td className="p-2 font-semibold">14:00 – 17:00</td>
                      <td className="p-2">
                        <strong>Awarding & Closing Ceremony:</strong> Pengumuman pemenang, penyerahan medali internasional, piala penghargaan, dan sertifikat resmi IYRC.
                      </td>
                      <td className="p-2 text-[11px] text-slate-600">Pemberian Medali & Piagam</td>
                    </tr>
                    <tr className="bg-emerald-50/30">
                      <td className="p-2 font-semibold">18:00 – 21:00</td>
                      <td className="p-2">Gala dinner & farewell reception kontingen seluruh negara partisipan. Transfer kembali ke hotel.</td>
                      <td className="p-2 text-[11px] text-slate-600">Hotel Paket IYRC (Malam 3)</td>
                    </tr>

                    <tr>
                      <td className="p-2 font-bold text-slate-800" rowSpan={3}>
                        14 Des 2026<br /><span className="text-[10px] text-slate-500 font-normal">Senin</span>
                      </td>
                      <td className="p-2 font-semibold">08:00 – 10:00</td>
                      <td className="p-2">Paket resmi IYRC berakhir. Check-out dari hotel paket Longgang dan transfer kontingen menuju hotel di pusat kota Shenzhen.</td>
                      <td className="p-2 text-[11px] text-slate-600">Transfer van & bagasi</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">11:00 – 17:00</td>
                      <td className="p-2">
                        Check-in hotel tambahan (3 kamar). Program edukatif terarah: Kunjungan ekosistem inovasi hardware & AI global di Shenzhen (Huaqiangbei & Science Tech Park).
                      </td>
                      <td className="p-2 text-[11px] text-slate-600">Eksplorasi teknologi edukatif</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">18:30 – 21:00</td>
                      <td className="p-2">Makan malam bersama dan persiapan akhir packing bagasi untuk kepulangan esok hari.</td>
                      <td className="p-2 text-[11px] text-slate-600">Hotel Pusat Kota (Malam 4)</td>
                    </tr>

                    <tr className="bg-violet-50/30">
                      <td className="p-2 font-bold text-violet-900" rowSpan={3}>
                        15 Des 2026<br /><span className="text-[10px] text-slate-500 font-normal">Selasa</span>
                      </td>
                      <td className="p-2 font-semibold">09:00 – 13:00</td>
                      <td className="p-2">Check-out hotel Shenzhen, free program singkat di sekitar hotel dan makan siang.</td>
                      <td className="p-2 text-[11px] text-slate-600">Persiapan dokumen kepulangan</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">14:30 – 17:00</td>
                      <td className="p-2">Transfer menuju Shenzhen Bao'an International Airport (SZX), proses check-in CZ8353, baggage drop, dan imigrasi keluar China.</td>
                      <td className="p-2 text-[11px] text-slate-600">Standby bandara 3 jam sebelumnya</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">19:05 – 23:20</td>
                      <td className="p-2">Penerbangan CZ8353 kembali ke Jakarta. Mendarat di Bandara Soekarno-Hatta (CGK T3) pukul 23:20 WIB. Bermalam transit di area bandara.</td>
                      <td className="p-2 text-[11px] text-slate-600">Tiba Jakarta 23:20 WIB</td>
                    </tr>

                    <tr>
                      <td className="p-2 font-bold text-slate-800">
                        16 Des 2026<br /><span className="text-[10px] text-slate-500 font-normal">Rabu</span>
                      </td>
                      <td className="p-2 font-semibold">06:00 – Selesai</td>
                      <td className="p-2">
                        Penerbangan lanjutan domestik dari Jakarta (CGK) menuju bandara daerah asal masing-masing (Kupang, Tidore, Tanjabtim). Delegasi kembali ke rumah dan sekolah. Perjalanan selesai.
                      </td>
                      <td className="p-2 text-[11px] text-emerald-700 font-bold">Misi Selesai</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TANDA TANGAN PENGESAHAN KORWIL 2 (DI SEBELAH KANAN) */}
              <div className="pt-8 flex justify-end">
                <div className="text-center w-72 space-y-16">
                  <p className="text-slate-600 font-semibold text-xs">
                    PT. Jully Tjindrawan Robotik<br />
                    <span className="text-[11px] text-indigo-700 font-bold">Koordinator Wilayah 2 Program SNT</span>
                  </p>
                  <div>
                    <p className="font-extrabold text-slate-900 underline text-sm">Jully Tjindrawan, MBA</p>
                    <p className="text-slate-500 font-medium text-[11px]">Koordinator Wilayah 2 & Founder Robotic Explorer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 20mm;
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
          /* 3. Tampilkan hanya dokumen target cetak surat undangan */
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
          /* 4. Tampilkan hanya dokumen target cetak itinerary */
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
        }
      `}</style>
    </div>
  );
}
