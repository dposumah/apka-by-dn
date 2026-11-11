"use client"

import { 
  Edit, 
  Printer, 
  Copy, 
  Trash2, 
  Link as LinkIcon, 
  FileText, 
  FileCheck2, 
  Loader2, 
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Check,
  AlertCircle,
  History,
  Sparkles,
  Fuel,
  Sliders,
  FileDown,
  Save,
  MessageSquare,
  Phone
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { hitungTotalTransportRekap, hitungDetailTransportRekap, hitungTransportDenganRumusBBMDanPlafon, hitungTransportSesi, HARGA_BBM_DEFAULT } from '@/lib/transport'
import { useState, useEffect, useMemo } from 'react'
import { createRekapManual, deleteRekap, generateKwitansiHonor, generateKwitansiTransportBulanan, updateRekapTransport, updateRekapHonorManual, copyRekapFromPreviousMonth, batchUpdateTransportByFormula } from '@/app/actions/rekap'
import { adminGenerateInvoiceHonor, uploadBuktiRekap, generateInvoiceHonorRecord } from '@/app/actions/rekap'
import { getInvoiceHtml, getKwitansiHtml, getMonthlyRekapReportHtml } from './pdf-generator'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/modal-provider';

import { getFasilitatorJpForMonth, syncLaporanToRekap } from '@/app/actions/rekap'
import { FilePreviewModal } from '@/components/shared/FilePreviewModal'
import { uploadFileClient } from '@/lib/upload-client'
import { RekapWhatsAppModal, RekapWhatsAppModalProps } from './RekapWhatsAppModal'
import {
  buildRekapWhatsAppMessage,
  copyImageFileToClipboard,
  launchWhatsAppDesktop,
  normalizeWhatsAppNumber,
} from '@/lib/rekap-whatsapp'

export function RekapHonorClient({ 
  initialData, 
  fasilitators = [],
  globalHargaBbm = 16300
}: { 
  initialData: any[], 
  fasilitators?: any[],
  globalHargaBbm?: number 
}) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
  }>({
    isOpen: false,
    title: '',
    url: ''
  });
  
  const [showManualForm, setShowManualForm] = useState(false)
  const [editingTransportRekap, setEditingTransportRekap] = useState<any | null>(null)
  const [transportAmountInput, setTransportAmountInput] = useState<string>('')
  const [isSavingTransport, setIsSavingTransport] = useState(false)
  const [editHargaBbm, setEditHargaBbm] = useState((globalHargaBbm || 16300).toString())
  const [editKonsumsi, setEditKonsumsi] = useState('10')
  const [editUseMax, setEditUseMax] = useState(false)
  const [editMaxType, setEditMaxType] = useState<'PER_SESI' | 'TOTAL'>('PER_SESI')
  const [editMaxNominal, setEditMaxNominal] = useState('150000')
  const [editUseMin, setEditUseMin] = useState(true)

  // Batch Transport Modal states
  const [showBatchTransportModal, setShowBatchTransportModal] = useState(false)
  const [batchTransportBulan, setBatchTransportBulan] = useState('2026-10')
  const [batchUseBbm, setBatchUseBbm] = useState(true)
  const [batchModeBbm, setBatchModeBbm] = useState<'MURNI' | 'COMBINED'>('MURNI')
  const [batchHormatiLaporan, setBatchHormatiLaporan] = useState(true)
  const [batchHargaBbm, setBatchHargaBbm] = useState((globalHargaBbm || 16300).toString())
  const [batchKonsumsi, setBatchKonsumsi] = useState('10')
  const [batchUseMin, setBatchUseMin] = useState(true)
  const [batchMinNominal, setBatchMinNominal] = useState('120000')
  const [batchUseMax, setBatchUseMax] = useState(true)
  const [batchMaxType, setBatchMaxType] = useState<'PER_SESI' | 'TOTAL'>('PER_SESI')
  const [batchMaxNominal, setBatchMaxNominal] = useState('150000')
  const [isApplyingBatchTransport, setIsApplyingBatchTransport] = useState(false)
  const [batchSelectedRekapIds, setBatchSelectedRekapIds] = useState<string[]>([])

  useEffect(() => {
    if (globalHargaBbm) {
      setEditHargaBbm(globalHargaBbm.toString());
      setBatchHargaBbm(globalHargaBbm.toString());
    }
  }, [globalHargaBbm]);

  // Manual Form Transport states
  const [manualTransport, setManualTransport] = useState('')

  // Export Rekap Bulanan States
  const [showExportMonthlyModal, setShowExportMonthlyModal] = useState(false)
  const [exportSelectedBulan, setExportSelectedBulan] = useState<string>('')
  const [exportKopType, setExportKopType] = useState<'maleo' | 'robotic' | 'none'>('maleo')
  const [exportOrientation, setExportOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const [exportStatusFilter, setExportStatusFilter] = useState<'ALL' | 'LUNAS' | 'UNPAID'>('ALL')
  const [exportTanggalDokumen, setExportTanggalDokumen] = useState<string>('')
  const [isGeneratingReportPdf, setIsGeneratingReportPdf] = useState(false)

  const openEditTransportModal = (rekap: any) => {
    setEditingTransportRekap(rekap)
    const currentAmount = hitungTotalTransportRekap(rekap)
    setTransportAmountInput(currentAmount.toString())
    setEditUseMax(false)
    setEditMaxType('PER_SESI')
    setEditMaxNominal('150000')
    setEditUseMin(true)
  }

  const handleSaveTransport = async () => {
    if (!editingTransportRekap) return
    setIsSavingTransport(true)
    try {
      const nominal = parseFloat(transportAmountInput) || 0
      const res = await updateRekapTransport(editingTransportRekap.id, nominal)
      if (res?.error) {
        await alert(res.error)
      } else {
        await alert('Biaya transport berhasil diperbarui.')
        setEditingTransportRekap(null)
        router.refresh()
      }
    } catch (e: any) {
      await alert('Gagal memperbarui: ' + (e.message || ''))
    } finally {
      setIsSavingTransport(false)
    }
  }

  const handleResetTransportToSystem = async () => {
    if (!editingTransportRekap) return
    if (!(await confirm('Kembalikan ke hitungan transport otomatis sistem?'))) return
    setIsSavingTransport(true)
    try {
      const res = await updateRekapTransport(editingTransportRekap.id, null)
      if (res?.error) {
        await alert(res.error)
      } else {
        await alert('Biaya transport dikembalikan ke kalkulasi sistem.')
        setEditingTransportRekap(null)
        router.refresh()
      }
    } catch (e: any) {
      await alert('Gagal mereset: ' + (e.message || ''))
    } finally {
      setIsSavingTransport(false)
    }
  }

  // Helper identifikasi Fasilitator Muh. Hanifudin H, S.Pd
  const isFasilHanifudin = (nama?: string | null) => {
    if (!nama) return false;
    const n = nama.toLowerCase();
    return n.includes('hanifudin') || n.includes('hanif');
  };

  // State Modal Edit Honor Manual Khusus
  const [showEditHonorModal, setShowEditHonorModal] = useState(false);
  const [editingHonorRekap, setEditingHonorRekap] = useState<any | null>(null);
  const [honorAmountInput, setHonorAmountInput] = useState<string>('');
  const [honorZeroTransport, setHonorZeroTransport] = useState<boolean>(true);
  const [isSavingHonor, setIsSavingHonor] = useState<boolean>(false);

  const openEditHonorModal = (rekap: any) => {
    setEditingHonorRekap(rekap);
    setHonorAmountInput((rekap.totalHonor || 0).toString());
    setHonorZeroTransport(rekap.totalTransport === 0 || rekap.totalTransport === null || isFasilHanifudin(rekap.fasilitator?.namaLengkap));
    setShowEditHonorModal(true);
  };

  const handleSaveHonorManual = async () => {
    if (!editingHonorRekap) return;
    const val = parseFloat(honorAmountInput);
    if (isNaN(val) || val < 0) {
      await alert("Masukkan nominal honor yang valid");
      return;
    }

    setIsSavingHonor(true);
    try {
      const res = await updateRekapHonorManual(editingHonorRekap.id, val, {
        setZeroTransport: honorZeroTransport
      });
      if (res?.error) {
        await alert("Gagal memperbarui honor: " + res.error);
        return;
      }
      setShowEditHonorModal(false);
      await alert(`Berhasil memperbarui honor manual untuk ${editingHonorRekap.fasilitator?.namaLengkap || 'Fasilitator'} menjadi ${formatCurrency(val)}!`);
      router.refresh();
    } catch (err: any) {
      await alert("Terjadi kesalahan: " + (err.message || err));
    } finally {
      setIsSavingHonor(false);
    }
  };

  const [manualFasilId, setManualFasilId] = useState('')
  const [manualBulan, setManualBulan] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })
  
  const [manualJPIntra, setManualJPIntra] = useState('')
  const [manualJPEkstra, setManualJPEkstra] = useState('')
  const [manualRate, setManualRate] = useState('65000')
  const [manualSesi, setManualSesi] = useState('4')
  const [manualHonor, setManualHonor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
    
  // Computed values
  const computedTotalJP = (parseInt(manualJPIntra) || 0) + (parseInt(manualJPEkstra) || 0);
  const computedTotalHonor = (manualHonor !== '' && !isNaN(Number(manualHonor)))
    ? parseFloat(manualHonor)
    : computedTotalJP * (parseInt(manualRate) || 0);

  // Previous Month Helper State for Manual Form
  const [lastCopiedPrev, setLastCopiedPrev] = useState<{
    bulan: string;
    oldSesi: number;
    intraPerSesi: number;
    ekstraPerSesi: number;
    rate: number;
  } | null>(null)

  // Find previous month's rekap for the selected fasilitator in manual form
  const previousRekapForSelectedFasil = useMemo(() => {
    if (!manualFasilId) return null;
    const list = initialData
      .filter((r: any) => r.fasilitatorId === manualFasilId && (!manualBulan || r.bulan < manualBulan))
      .sort((a: any, b: any) => (b.bulan || '').localeCompare(a.bulan || ''));
    return list[0] || null;
  }, [manualFasilId, manualBulan, initialData]);

  const handleApplyPreviousData = (prev: any, scaleToNewSesi: boolean = true) => {
    if (!prev) return;
    const oldSesi = prev.jumlahSesi || 3;
    const targetSesi = parseInt(manualSesi) || 4;
    const rate = prev.totalJP > 0 ? Math.round(prev.totalHonor / prev.totalJP) : 65000;
    setManualRate(rate.toString());

    const intraPerSesi = oldSesi > 0 ? (prev.totalJPIntra || 0) / oldSesi : 0;
    const ekstraPerSesi = oldSesi > 0 ? (prev.totalJPEkstra || 0) / oldSesi : 0;

    if (scaleToNewSesi && targetSesi > 0) {
      const newIntra = Math.round(intraPerSesi * targetSesi);
      const newEkstra = Math.round(ekstraPerSesi * targetSesi);
      setManualJPIntra(newIntra.toString());
      setManualJPEkstra(newEkstra.toString());
    } else {
      setManualSesi(oldSesi.toString());
      setManualJPIntra((prev.totalJPIntra || 0).toString());
      setManualJPEkstra((prev.totalJPEkstra || 0).toString());
    }

    setLastCopiedPrev({
      bulan: prev.bulan,
      oldSesi,
      intraPerSesi,
      ekstraPerSesi,
      rate
    });
  };

  const handleSesiChange = (newSesiStr: string) => {
    setManualSesi(newSesiStr);
    const newSesiNum = parseInt(newSesiStr);
    if (lastCopiedPrev && newSesiNum > 0) {
      const newIntra = Math.round(lastCopiedPrev.intraPerSesi * newSesiNum);
      const newEkstra = Math.round(lastCopiedPrev.ekstraPerSesi * newSesiNum);
      setManualJPIntra(newIntra.toString());
      setManualJPEkstra(newEkstra.toString());
    }
  };

  // Bulk Copy Modal State
  const [showBulkCopyModal, setShowBulkCopyModal] = useState(false);
  const [bulkSourceBulan, setBulkSourceBulan] = useState(() => {
    if (initialData.length > 0) {
      const distinct = Array.from(new Set(initialData.map((r: any) => r.bulan).filter(Boolean))).sort().reverse();
      return distinct[0] || '2026-09';
    }
    return '2026-09';
  });
  const [bulkTargetBulan, setBulkTargetBulan] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [bulkNewSesi, setBulkNewSesi] = useState<number>(4);
  const [isBulkCopying, setIsBulkCopying] = useState(false);

  // Distinct months in initialData for bulk copy source selector
  const availableSourceMonths = useMemo(() => {
    const setM = new Set<string>();
    initialData.forEach((r: any) => {
      if (r.bulan) setM.add(r.bulan);
    });
    return Array.from(setM).sort().reverse();
  }, [initialData]);

  // Bulk copy preview
  const bulkPreviewList = useMemo(() => {
    if (!bulkSourceBulan) return [];
    const sourceItems = initialData.filter((r: any) => r.bulan === bulkSourceBulan);
    const existingTargetFasils = new Set(
      initialData.filter((r: any) => r.bulan === bulkTargetBulan).map((r: any) => r.fasilitatorId)
    );

    return sourceItems.map((src: any) => {
      const oldSesi = src.jumlahSesi || 3;
      const ratio = oldSesi > 0 ? (bulkNewSesi || 4) / oldSesi : 1;
      const newIntra = Math.round((src.totalJPIntra || 0) * ratio);
      const newEkstra = Math.round((src.totalJPEkstra || 0) * ratio);
      const newTotalJP = newIntra + newEkstra;
      const rate = src.totalJP > 0 ? Math.round(src.totalHonor / src.totalJP) : 65000;
      const newHonor = newTotalJP * rate;
      const alreadyExists = existingTargetFasils.has(src.fasilitatorId);

      return {
        fasilitatorId: src.fasilitatorId,
        namaLengkap: src.fasilitator?.namaLengkap || '-',
        lokasiSNT: src.fasilitator?.lokasiSNT || '-',
        oldSesi,
        oldIntra: src.totalJPIntra || 0,
        oldEkstra: src.totalJPEkstra || 0,
        oldJP: src.totalJP || 0,
        oldHonor: src.totalHonor || 0,
        newSesi: bulkNewSesi || 4,
        newIntra,
        newEkstra,
        newTotalJP,
        newHonor,
        alreadyExists
      };
    });
  }, [bulkSourceBulan, bulkTargetBulan, bulkNewSesi, initialData]);

  const handleExecuteBulkCopy = async () => {
    const readyItems = bulkPreviewList.filter(item => !item.alreadyExists);
    if (readyItems.length === 0) {
      await alert('Tidak ada fasilitator yang perlu disalin (semua sudah ada di bulan tujuan).');
      return;
    }

    if (!bulkNewSesi || bulkNewSesi <= 0) {
      await alert('Masukkan jumlah pertemuan baru yang valid.');
      return;
    }

    if (!(await confirm(`Yakin ingin menyalin data ${readyItems.length} fasilitator dari bulan ${bulkSourceBulan} ke bulan ${bulkTargetBulan} dengan ${bulkNewSesi} pertemuan?`))) {
      return;
    }

    setIsBulkCopying(true);
    try {
      const res = await copyRekapFromPreviousMonth(bulkSourceBulan, bulkTargetBulan, bulkNewSesi);
      if (res?.success) {
        await alert(`Berhasil menyalin ${res.createdCount} rekapitulasi ke bulan ${bulkTargetBulan} (${bulkNewSesi} pertemuan)!`);
        setShowBulkCopyModal(false);
        router.refresh();
      }
    } catch (e: any) {
      await alert('Gagal menyalin: ' + (e.message || e));
    } finally {
      setIsBulkCopying(false);
    }
  };

  const availableRekapMonths = useMemo(() => {
    const setM = new Set<string>();
    initialData.forEach((r: any) => { if (r.bulan) setM.add(r.bulan); });
    const arr = Array.from(setM).sort((a, b) => b.localeCompare(a));
    return arr.length > 0 ? arr : ['2026-10', '2026-09'];
  }, [initialData]);

  const batchPreviewList = useMemo(() => {
    if (!showBatchTransportModal || !batchTransportBulan) return [];
    const list = initialData.filter((r: any) => r.bulan === batchTransportBulan);
    return list.map((r: any) => {
      const fasil = r.fasilitator || {};
      const jarak = Number(fasil.jarakPPKm) || 0;
      const sesi = Number(r.jumlahSesi) || 4;
      const currentTransport = hitungTotalTransportRekap(r);

      const calc = hitungTransportDenganRumusBBMDanPlafon(r, {
        useRumusBbm: batchUseBbm,
        modeBbmMurni: batchModeBbm === 'MURNI',
        hormatiLaporan: batchHormatiLaporan,
        persenTambahan: 20,
        hargaBBM: parseFloat(batchHargaBbm) || globalHargaBbm || 16300,
        konsumsiKmPerLiter: parseFloat(batchKonsumsi) || 10,
        useBatasMinimum: batchModeBbm !== 'MURNI' && batchUseMin,
        batasMinimumNominal: parseFloat(batchMinNominal) || 120000,
        useBatasMaksimal: batchUseMax,
        tipeBatasMaksimal: batchMaxType,
        batasMaksimalNominal: parseFloat(batchMaxNominal) || 0
      });

      return {
        rekapId: r.id,
        nama: fasil.namaLengkap || '-',
        lokasi: fasil.lokasiSNT || '-',
        jarak,
        sesi,
        currentTransport,
        newPerSesi: calc.perSesiSetelahPlafon,
        newTotal: calc.totalSetelahPlafon,
        isCapped: calc.isCapped,
        keterangan: calc.keterangan
      };
    });
  }, [showBatchTransportModal, batchTransportBulan, initialData, batchUseBbm, batchModeBbm, batchHormatiLaporan, batchHargaBbm, batchKonsumsi, batchUseMin, batchMinNominal, batchUseMax, batchMaxType, batchMaxNominal]);

  const handleApplyBatchTransport = async () => {
    if (batchPreviewList.length === 0) return;
    const targetCount = batchSelectedRekapIds.length > 0 ? batchSelectedRekapIds.length : batchPreviewList.length;
    if (!(await confirm(`Terapkan perhitungan transport (Rumus BBM & Batas Maksimal) ke ${targetCount} rekapitulasi pada bulan ${batchTransportBulan}?`))) return;

    setIsApplyingBatchTransport(true);
    try {
      const res = await batchUpdateTransportByFormula(batchTransportBulan, {
        useRumusBbm: batchUseBbm,
        modeBbmMurni: batchModeBbm === 'MURNI',
        hormatiLaporan: batchHormatiLaporan,
        persenTambahan: 20,
        hargaBBM: parseFloat(batchHargaBbm) || globalHargaBbm || 16300,
        konsumsiKmPerLiter: parseFloat(batchKonsumsi) || 10,
        useBatasMinimum: batchModeBbm !== 'MURNI' && batchUseMin,
        batasMinimumNominal: parseFloat(batchMinNominal) || 120000,
        useBatasMaksimal: batchUseMax,
        tipeBatasMaksimal: batchMaxType,
        batasMaksimalNominal: parseFloat(batchMaxNominal) || 0,
        selectedRekapIds: batchSelectedRekapIds.length > 0 ? batchSelectedRekapIds : undefined
      });

      if (res?.error) {
        await alert(res.error);
      } else {
        await alert(`Berhasil menerapkan rumus BBM & batas maksimal ke ${res.count} rekapitulasi!`);
        setShowBatchTransportModal(false);
        router.refresh();
      }
    } catch (e: any) {
      await alert('Gagal memperbarui transport: ' + (e.message || ''));
    } finally {
      setIsApplyingBatchTransport(false);
    }
  };


  // Helper Status Pembayaran
  const getRekapPaymentStatus = (rekap: any): 'LUNAS' | 'SEBAGIAN' | 'BELUM_BAYAR' => {
    const hasHonor = Boolean(rekap.buktiPembayaranHonor)
    const totalTransport = hitungTotalTransportRekap(rekap)
    const needsTransport = totalTransport > 0
    const hasTransport = Boolean(rekap.buktiPembayaranTransport)

    if (rekap.status === 'APPROVED' || (hasHonor && (!needsTransport || hasTransport))) {
      return 'LUNAS'
    }
    if (hasHonor || hasTransport) {
      return 'SEBAGIAN'
    }
    return 'BELUM_BAYAR'
  }

  // Format Indonesian Month
  const formatBulanIndo = (bulanStr: string) => {
    if (!bulanStr) return '-'
    const parts = bulanStr.split('-')
    if (parts.length !== 2) return bulanStr
    const year = parts[0]
    const monthNum = parseInt(parts[1], 10)
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const bulanName = namaBulan[monthNum - 1] || parts[1]
    return `${bulanName} ${year}`
  }

  // Live Preview Data for Export PDF
  const exportPreviewData = useMemo(() => {
    if (!exportSelectedBulan) return null;
    let list = initialData.filter((r: any) => r.bulan === exportSelectedBulan);
    if (exportStatusFilter === 'LUNAS') {
      list = list.filter((r: any) => {
        const st = getRekapPaymentStatus(r);
        return st === 'LUNAS' || st === 'SEBAGIAN';
      });
    } else if (exportStatusFilter === 'UNPAID') {
      list = list.filter((r: any) => {
        const st = getRekapPaymentStatus(r);
        return st === 'BELUM_BAYAR';
      });
    }

    const totalFasilitator = list.length;
    let totalJP = 0;
    let totalHonor = 0;
    let totalTransport = 0;
    let grandTotal = 0;
    let lunasCount = 0;
    let unpaidCount = 0;

    list.forEach((r: any) => {
      totalJP += (r.totalJP || 0);
      totalHonor += (r.totalHonor || 0);
      const t = hitungTotalTransportRekap(r);
      totalTransport += t;
      grandTotal += ((r.totalHonor || 0) + t);
      const st = getRekapPaymentStatus(r);
      if (st === 'LUNAS' || st === 'SEBAGIAN') lunasCount++;
      else unpaidCount++;
    });

    return {
      items: list,
      totalFasilitator,
      totalJP,
      totalHonor,
      totalTransport,
      grandTotal,
      lunasCount,
      unpaidCount
    };
  }, [initialData, exportSelectedBulan, exportStatusFilter]);

  const handleOpenExportModal = (bulan?: string) => {
    const targetBulan = bulan || filterBulan || availableRekapMonths[0] || '2026-10';
    setExportSelectedBulan(targetBulan);
    setExportKopType('maleo');
    setExportOrientation('landscape');
    setExportStatusFilter('ALL');
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    setExportTanggalDokumen(localISOTime);
    setShowExportMonthlyModal(true);
  };

  const handleGenerateMonthlyReportPdf = async () => {
    if (!exportSelectedBulan) {
      alert("Silakan pilih bulan rekapitulasi terlebih dahulu.");
      return;
    }

    if (!exportPreviewData || exportPreviewData.items.length === 0) {
      alert(`Tidak ada data rekapitulasi untuk bulan ${formatBulanIndo(exportSelectedBulan)}.`);
      return;
    }

    setIsGeneratingReportPdf(true);
    try {
      const sortedItems = [...exportPreviewData.items].sort((a: any, b: any) => 
        (a.fasilitator?.namaLengkap || '').localeCompare(b.fasilitator?.namaLengkap || '')
      );

      let tanggalFormatted = '';
      if (exportTanggalDokumen) {
        const d = new Date(exportTanggalDokumen);
        tanggalFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      const htmlString = getMonthlyRekapReportHtml(
        {
          bulan: exportSelectedBulan,
          items: sortedItems,
          kopType: exportKopType,
          tanggalDokumen: tanggalFormatted,
          orientation: exportOrientation,
          filterStatus: exportStatusFilter
        },
        terbilangRupiah
      );

      const isLandscape = exportOrientation === 'landscape';
      const widthPx = isLandscape ? 1123 : 794;

      // Preload kop image jika ada agar html2canvas tidak blank
      if (exportKopType !== 'none' && typeof window !== 'undefined') {
        const kopUrl = window.location.origin + (exportKopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png');
        try {
          const img = new Image();
          img.src = kopUrl;
          if (!img.complete) {
            await new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            });
          }
        } catch (e) {
          console.warn('Preload kop notice', e);
        }
      }

      const wrapper = document.createElement('div');
      wrapper.innerHTML = htmlString;
      wrapper.style.width = `${widthPx}px`;
      wrapper.style.backgroundColor = '#ffffff';

      let html2pdf: any; 
      try { 
        html2pdf = require('html2pdf.js'); 
      } catch (e) { 
        html2pdf = (window as any).html2pdf; 
      }
      if (typeof html2pdf !== 'function' && html2pdf?.default) {
        html2pdf = html2pdf.default;
      }

      const filename = `Rekap_Kebutuhan_Honor_${exportSelectedBulan}_${exportOrientation}.pdf`;
      const opt = {
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          windowWidth: widthPx 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: exportOrientation },
        pagebreak: { mode: 'css' }
      };

      await html2pdf().set(opt).from(wrapper).save();
      setShowExportMonthlyModal(false);
    } catch (err: any) {
      console.error('GENERATE MONTHLY REPORT PDF ERROR', err);
      alert("Gagal generate PDF: " + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingReportPdf(false);
    }
  };

  const handlePrintViaBrowser = () => {
    if (!exportSelectedBulan) {
      alert("Silakan pilih bulan rekapitulasi terlebih dahulu.");
      return;
    }

    if (!exportPreviewData || exportPreviewData.items.length === 0) {
      alert(`Tidak ada data rekapitulasi untuk bulan ${formatBulanIndo(exportSelectedBulan)}.`);
      return;
    }

    const sortedItems = [...exportPreviewData.items].sort((a: any, b: any) => 
      (a.fasilitator?.namaLengkap || '').localeCompare(b.fasilitator?.namaLengkap || '')
    );

    let tanggalFormatted = '';
    if (exportTanggalDokumen) {
      const d = new Date(exportTanggalDokumen);
      tanggalFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    const htmlString = getMonthlyRekapReportHtml(
      {
        bulan: exportSelectedBulan,
        items: sortedItems,
        kopType: exportKopType,
        tanggalDokumen: tanggalFormatted,
        orientation: exportOrientation,
        filterStatus: exportStatusFilter
      },
      terbilangRupiah
    );

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert("Popup blocker browser aktif. Mohon izinkan popup window untuk mencetak laporan.");
      return;
    }
    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekap Kebutuhan Honor & Transport Bulan ${formatBulanIndo(exportSelectedBulan)}</title>
          <meta charset="utf-8" />
          <style>
            @page { 
              size: A4 ${exportOrientation}; 
              margin: 8mm; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              background: #ffffff; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
          </style>
        </head>
        <body>
          ${htmlString}
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Active Tab & View Mode
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNPAID' | 'PAID'>('PAID')
  const [isGroupedByMonth, setIsGroupedByMonth] = useState<boolean>(true)
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({})

  const toggleMonth = (bulan: string) => {
    setCollapsedMonths(prev => ({
      ...prev,
      [bulan]: !prev[bulan]
    }))
  }

  const [filterLokasi, setFilterLokasi] = useState('')
  const [filterNama, setFilterNama] = useState('')
  const [filterBulan, setFilterBulan] = useState('')

  const lokasiList = Array.from(
    new Set([
      ...initialData.map((r: any) => r.fasilitator?.lokasiSNT),
      ...fasilitators.map((f: any) => f.lokasiSNT)
    ].filter(Boolean))
  ).sort((a: any, b: any) => (a as string).localeCompare(b as string)) as string[];

  const [sortField, setSortField] = useState<'nama' | 'lokasi' | 'bulan' | 'tanggal'>('tanggal')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: 'nama' | 'lokasi' | 'bulan' | 'tanggal') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Global Statistics across initialData
  const stats = useMemo(() => {
    let totalHonor = 0
    let totalTransport = 0
    let lunasCount = 0
    let unpaidCount = 0
    const uniqueMonths = new Set<string>()

    for (const r of initialData) {
      if (r.bulan) uniqueMonths.add(r.bulan)
      totalHonor += (r.totalHonor || 0)
      totalTransport += hitungTotalTransportRekap(r)
      const st = getRekapPaymentStatus(r)
      if (st === 'LUNAS' || st === 'SEBAGIAN') {
        lunasCount++
      } else {
        unpaidCount++
      }
    }

    return {
      totalCount: initialData.length,
      lunasCount,
      unpaidCount,
      totalHonor,
      totalTransport,
      grandTotal: totalHonor + totalTransport,
      monthCount: uniqueMonths.size,
      monthsList: Array.from(uniqueMonths).sort().reverse()
    }
  }, [initialData])

  const filteredData = useMemo(() => {
    return initialData.filter((rekap: any) => {
      const matchLokasi = filterLokasi ? rekap.fasilitator?.lokasiSNT === filterLokasi : true;
      const matchNama = filterNama ? rekap.fasilitator?.namaLengkap?.toLowerCase().includes(filterNama.toLowerCase()) : true;
      const matchBulan = filterBulan ? rekap.bulan === filterBulan : true;

      const st = getRekapPaymentStatus(rekap)
      let matchTab = true
      if (activeTab === 'PAID') {
        matchTab = st === 'LUNAS' || st === 'SEBAGIAN'
      } else if (activeTab === 'UNPAID') {
        matchTab = st === 'BELUM_BAYAR'
      }

      return matchLokasi && matchNama && matchBulan && matchTab;
    });
  }, [initialData, filterLokasi, filterNama, filterBulan, activeTab]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comparison = 0
      if (sortField === 'nama') {
        comparison = (a.fasilitator?.namaLengkap || '').localeCompare(b.fasilitator?.namaLengkap || '')
      } else if (sortField === 'lokasi') {
        comparison = (a.fasilitator?.lokasiSNT || '').localeCompare(b.fasilitator?.lokasiSNT || '')
      } else if (sortField === 'bulan') {
        comparison = (a.bulan || '').localeCompare(b.bulan || '')
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortField, sortOrder]);

  const monthGroups = useMemo(() => {
    const groups: Record<string, {
      bulan: string;
      labelBulan: string;
      items: any[];
      totalFasilitator: number;
      totalJP: number;
      totalHonor: number;
      totalTransport: number;
      grandTotal: number;
      lunasCount: number;
      unpaidCount: number;
    }> = {}

    for (const item of sortedData) {
      const b = item.bulan || 'Tanpa Bulan'
      if (!groups[b]) {
        groups[b] = {
          bulan: b,
          labelBulan: formatBulanIndo(b),
          items: [],
          totalFasilitator: 0,
          totalJP: 0,
          totalHonor: 0,
          totalTransport: 0,
          grandTotal: 0,
          lunasCount: 0,
          unpaidCount: 0
        }
      }
      groups[b].items.push(item)
      groups[b].totalFasilitator += 1
      groups[b].totalJP += (item.totalJP || 0)
      groups[b].totalHonor += (item.totalHonor || 0)
      const t = hitungTotalTransportRekap(item)
      groups[b].totalTransport += t
      groups[b].grandTotal += ((item.totalHonor || 0) + t)

      const st = getRekapPaymentStatus(item)
      if (st === 'LUNAS' || st === 'SEBAGIAN') {
        groups[b].lunasCount += 1
      } else {
        groups[b].unpaidCount += 1
      }
    }

    return Object.values(groups).sort((a, b) => b.bulan.localeCompare(a.bulan))
  }, [sortedData])

  const expandAll = () => setCollapsedMonths({})
  const collapseAll = () => {
    const all: Record<string, boolean> = {}
    monthGroups.forEach(g => { all[g.bulan] = true })
    setCollapsedMonths(all)
  }

  useEffect(() => {
    async function fetchJp() {
      if (manualFasilId && manualBulan) {
        try {
          const res = await getFasilitatorJpForMonth(manualFasilId, manualBulan);
          if (res) {
            setManualJPIntra(res.totalJPIntra.toString());
            setManualJPEkstra(res.totalJPEkstra.toString());
            setManualSesi(res.sesi.toString());
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchJp();
  }, [manualFasilId, manualBulan])

  

  
  
  const handleSync = async (id: string) => {
    if (await confirm('Tautkan semua laporan telat di bulan ini ke rekap ini? (Angka Honor tidak akan berubah)')) {
      try {
        const count = await syncLaporanToRekap(id)
        await alert(`Berhasil menautkan ${count} laporan.`)
        router.refresh()
      } catch (e: any) {
        await alert(e.message)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (await confirm('Yakin ingin menghapus rekap ini?')) {
      try {
        await deleteRekap(id)
        router.refresh()
      } catch (e: any) {
        await alert(e.message)
      }
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const transportVal = (manualTransport !== '' && !isNaN(Number(manualTransport))) ? parseFloat(manualTransport) : null;
      await createRekapManual(
        manualFasilId, 
        manualBulan, 
        computedTotalJP, 
        computedTotalHonor, 
        parseInt(manualSesi) || 4, 
        parseInt(manualJPIntra) || 0, 
        parseInt(manualJPEkstra) || 0,
        transportVal
      )
      setShowManualForm(false)
      setManualFasilId('')
      setManualBulan('')
      setManualRate('65000')
      setManualSesi('4')
      setManualTransport('')
      router.refresh()
    } catch(err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }
const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Custom Modal State for Kop Surat
  const [showKopModal, setShowKopModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadingRekap, setUploadingRekap] = useState<any>(null)
  const [honorFile, setHonorFile] = useState<File | null>(null)
  const [transportFile, setTransportFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [separateReceiptUpload, setSeparateReceiptUpload] = useState(false)
  const [uploadWaPhone, setUploadWaPhone] = useState('')
  const [autoLaunchWaAfterUpload, setAutoLaunchWaAfterUpload] = useState(true)
  const [copyImageAfterUpload, setCopyImageAfterUpload] = useState(true)
  const [waModalState, setWaModalState] = useState<{
    isOpen: boolean;
    rekap: any | null;
    postUploadInfo?: RekapWhatsAppModalProps["postUploadInfo"];
  }>({ isOpen: false, rekap: null, postUploadInfo: null })

  const openUploadBuktiModal = (rekap: any) => {
    setUploadingRekap(rekap)
    setHonorFile(null)
    setTransportFile(null)
    setSeparateReceiptUpload(false)
    setUploadWaPhone(rekap?.fasilitator?.kontak || '')
    setAutoLaunchWaAfterUpload(true)
    setCopyImageAfterUpload(true)
    setShowUploadModal(true)
  }

  const [selectedRekap, setSelectedRekap] = useState<any>(null)
  
  // New variables for Kwitansi manual input
  const [printCheckInvoice, setPrintCheckInvoice] = useState(true)
  const [printCheckHonor, setPrintCheckHonor] = useState(false)
  const [printCheckTransport, setPrintCheckTransport] = useState(false)
  const [printKopType, setPrintKopType] = useState<'maleo' | 'robotic'>('maleo')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  useEffect(() => {
    import('html2pdf.js').then(m => { (window as any).html2pdf = m.default || m; }).catch(e => console.error(e));
  }, []);

  const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputTanggal, setInputTanggal] = useState("")
  const [isUnlockedHonor, setIsUnlockedHonor] = useState(false)
  const [isUnlockedTransport, setIsUnlockedTransport] = useState(false)
  const [isUnlockedInvoice, setIsUnlockedInvoice] = useState(false)

  const getKwHonor = (rekap: any) => {
    if (!rekap?.kwitansiRecord) return null;
    if (Array.isArray(rekap.kwitansiRecord)) {
      return rekap.kwitansiRecord.find((k: any) => k.tipeKwitansi === 'HONOR' || (!k.tipeKwitansi && Math.abs(k.nominal - (rekap.totalHonor || 0)) < 1)) || null;
    }
    return rekap.kwitansiRecord;
  };

  const getKwTransport = (rekap: any) => {
    if (!rekap?.kwitansiRecord) return null;
    if (Array.isArray(rekap.kwitansiRecord)) {
      return rekap.kwitansiRecord.find((k: any) => k.tipeKwitansi === 'TRANSPORT') || null;
    }
    return null;
  };

  const getInvHonor = (rekap: any) => {
    if (!rekap?.invoiceRecord) return null;
    if (Array.isArray(rekap.invoiceRecord)) {
      return rekap.invoiceRecord[0] || null;
    }
    return rekap.invoiceRecord;
  };

    const [showTextModal, setShowTextModal] = useState(false)
    const [textToCopy, setTextToCopy] = useState("")
  
    const handleCopyText = (rekap: any) => {
      const bankName = rekap.fasilitator?.bankName || '-';
      const bankAccount = rekap.fasilitator?.bankAccount || '-';
      const namaLengkap = rekap.fasilitator?.namaLengkap || '-';
      const lokasi = rekap.fasilitator?.lokasiSNT || '-';
      const jumlahJP = rekap.totalJP;
      
      const detailTransport = hitungDetailTransportRekap(rekap);
      const totalTransport = detailTransport.totalTransport;

      const totalHonor = rekap.totalHonor || 0;
      const totalTransfer = totalHonor + totalTransport;
      
      const text = `Data Pembayaran Fasilitator:
Nama Fasilitator: ${namaLengkap}
Lokasi (SNT): ${lokasi}
Bulan Laporan: ${rekap.bulan}
Jumlah JP: ${jumlahJP} JP

Rincian Pembayaran:
- Subtotal Honor: Rp ${Math.round(totalHonor).toLocaleString('id-ID')} (${jumlahJP} JP)
- Bantuan Transport: Rp ${Math.round(totalTransport).toLocaleString('id-ID')} (${detailTransport.ringkasanKeterangan})
Total Transfer: Rp ${Math.round(totalTransfer).toLocaleString('id-ID')}

Informasi Rekening:
Bank: ${bankName}
No. Rekening: ${bankAccount}
Atas Nama: ${namaLengkap}`;
      
      setTextToCopy(text);
      setShowTextModal(true);
    }


  const openKopModal = (rekap: any) => {
    setSelectedRekap(rekap)
    setIsUnlockedHonor(false)
    setIsUnlockedTransport(false)
    setIsUnlockedInvoice(false)

    const inv = getInvHonor(rekap)
    const kwH = getKwHonor(rekap)
    const kwT = getKwTransport(rekap)

    const hasInv = !!(inv?.noInvoice && !inv.noInvoice.includes('TEMP'))
    const hasKwH = !!(kwH?.noKwitansi && !kwH.noKwitansi.includes('TEMP'))
    const hasKwT = !!(kwT?.noKwitansi && !kwT.noKwitansi.includes('TEMP'))

    const isZeroTransport = hitungTotalTransportRekap(rekap) <= 0;

    if (hasInv || hasKwH || hasKwT) {
      setPrintCheckInvoice(hasInv);
      setPrintCheckHonor(hasKwH);
      setPrintCheckTransport(isZeroTransport ? false : hasKwT);
    } else {
      setPrintCheckInvoice(true);
      setPrintCheckHonor(false);
      setPrintCheckTransport(false);
    }

    setPrintKopType('maleo')
    setInputNoUrut("")
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    setInputTanggal(localISOTime)
    setShowKopModal(true)
  }

  const generatePdfDirect = async () => {
    if (!selectedRekap) return;
    setIsGeneratingPdf(true);
    
    try {
      let htmlString = "";
      
      // 1. Invoice
      if (printCheckInvoice) {
        const forceNewInv = isUnlockedInvoice;
        const invRecord = await generateInvoiceHonorRecord(
          selectedRekap.id, 
          isUnlockedInvoice ? inputNoUrut : undefined, 
          isUnlockedInvoice ? inputTanggal : undefined, 
          forceNewInv
        );
        if (invRecord?.error) throw new Error(invRecord.error);
        htmlString += getInvoiceHtml(selectedRekap, printKopType, invRecord);
      }
      
      // 2. Kwitansi Honor
      if (printCheckHonor) {
        const forceNewKw = isUnlockedHonor;
        const record = await generateKwitansiHonor(
          selectedRekap.id, 
          isUnlockedHonor ? inputNoUrut : undefined, 
          isUnlockedHonor ? inputTanggal : undefined, 
          forceNewKw
        );
        if (record.error) throw new Error(record.error);
        htmlString += getKwitansiHtml(selectedRekap, record, 'HONOR', terbilangRupiah);
      }
      
      // 3. Kwitansi Transport
      if (printCheckTransport) {
        let transportNoUrut = isUnlockedTransport ? inputNoUrut : undefined;
        if (isUnlockedTransport && printCheckHonor && inputNoUrut) {
          const num = parseInt(inputNoUrut, 10);
          if (!isNaN(num)) transportNoUrut = (num + 1).toString();
          else transportNoUrut = inputNoUrut + "-T";
        }
        const forceNewTrans = isUnlockedTransport;
        const record = await generateKwitansiTransportBulanan(
          selectedRekap.id, 
          transportNoUrut, 
          isUnlockedTransport ? inputTanggal : undefined, 
          forceNewTrans
        );
        if (record.error) throw new Error(record.error);
        htmlString += getKwitansiHtml(selectedRekap, record, 'TRANSPORT', terbilangRupiah);
      }
      
      if (!htmlString) {
        setIsGeneratingPdf(false);
        alert("Pilih minimal satu dokumen untuk dicetak.");
        return;
      }
      
      // Put html in hidden div
      const wrapper = document.createElement('div');
      wrapper.innerHTML = htmlString;
      wrapper.style.width = '794px';
      wrapper.style.backgroundColor = '#ffffff';
      
      // Create PDF
      let html2pdf: any; try { html2pdf = require('html2pdf.js'); } catch (e) { html2pdf = (window as any).html2pdf; }
      const opt = {
        margin: 0,
        filename: `Rekap_Honor_${selectedRekap.fasilitator?.namaLengkap}_${selectedRekap.bulan}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css' }
      };
      
      await html2pdf().set(opt).from(wrapper).save();
      setShowKopModal(false);
      router.refresh();
    } catch (err: any) {
      console.error('GENERATE PDF ERROR', err, err.stack);
      alert("Gagal generate PDF: " + err.message + "\n\nStack: " + (err.stack ? err.stack.substring(0, 200) : ''));
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  const renderTable = (items: any[], showMonthColumn: boolean = true) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
          <tr>
            <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort("nama")}>
              <div className="flex items-center gap-1.5">
                <span>Fasilitator</span>
                <span className="text-slate-400 font-normal">{sortField === "nama" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}</span>
              </div>
            </th>
            <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort("lokasi")}>
              <div className="flex items-center gap-1.5">
                <span>Lokasi SNT</span>
                <span className="text-slate-400 font-normal">{sortField === "lokasi" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}</span>
              </div>
            </th>
            {showMonthColumn && (
              <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-center" onClick={() => handleSort("bulan")}>
                <div className="flex items-center justify-center gap-1.5">
                  <span>Bulan</span>
                  <span className="text-slate-400 font-normal">{sortField === "bulan" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}</span>
                </div>
              </th>
            )}
            <th className="py-3.5 px-4 text-center whitespace-nowrap">Total JP</th>
            <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Honor</th>
            <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
            <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Transport</th>
            <th className="py-3 px-3 text-center whitespace-nowrap">Bukti Bayar</th>
            <th className="py-3 px-3 text-center whitespace-nowrap w-36">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70">
          {items.length === 0 ? (
            <tr>
              <td colSpan={showMonthColumn ? 9 : 8} className="py-12 text-center text-slate-500">
                Tidak ada data rekapitulasi honorarium.
              </td>
            </tr>
          ) : (
            items.map((rekap) => (
              <tr key={rekap.id} className="hover:bg-slate-50/80 transition-colors">
                {/* 1. Fasilitator */}
                <td className="py-3 px-3 align-top">
                  <div className="font-semibold text-slate-900 leading-snug">{rekap.fasilitator?.namaLengkap}</div>
                  {isFasilHanifudin(rekap.fasilitator?.namaLengkap) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 mt-1">
                      <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                      <span>Fitur Khusus: Honor Manual</span>
                    </span>
                  )}
                  {(rekap.fasilitator?.bankName || rekap.fasilitator?.bankAccount) ? (
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      {rekap.fasilitator.bankName} {rekap.fasilitator.bankAccount ? `• ${rekap.fasilitator.bankAccount}` : ''}
                    </div>
                  ) : null}
                </td>

                {/* 2. Lokasi SNT */}
                <td className="py-3 px-3 align-top">
                  {rekap.fasilitator?.lokasiSNT ? (
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 block">
                        {rekap.fasilitator.lokasiSNT.split(' - ')[0]}
                      </span>
                      {rekap.fasilitator.lokasiSNT.split(' - ')[1] && (
                        <span className="text-slate-500 block text-[11px] mt-0.5 leading-tight">
                          {rekap.fasilitator.lokasiSNT.split(' - ')[1]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">-</span>
                  )}
                </td>

                {/* 3. Bulan */}
                {showMonthColumn && (
                  <td className="py-3 px-2.5 align-top text-center whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-medium border border-slate-200">
                      {rekap.bulan}
                    </span>
                  </td>
                )}

                {/* 4. Total JP */}
                <td className="py-3 px-2 align-top text-center whitespace-nowrap">
                  <span className="font-bold text-slate-800 text-sm">{rekap.totalJP}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">JP</span>
                  {isFasilHanifudin(rekap.fasilitator?.namaLengkap) && (
                    <span className="text-[9px] text-purple-600 font-semibold block mt-0.5">
                      (Abaikan Jam)
                    </span>
                  )}
                </td>

                {/* 5. Total Honor */}
                <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className={`font-bold text-sm ${isFasilHanifudin(rekap.fasilitator?.namaLengkap) ? 'text-purple-950 font-black' : 'text-slate-900'}`}>
                      {formatCurrency(rekap.totalHonor)}
                    </div>
                    <button 
                      type="button"
                      onClick={() => openEditHonorModal(rekap)}
                      className={`p-1 rounded transition-colors cursor-pointer border ${
                        isFasilHanifudin(rekap.fasilitator?.namaLengkap)
                          ? 'hover:bg-purple-100 bg-purple-50 text-purple-700 border-purple-300 shadow-xs'
                          : 'hover:bg-indigo-100 bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                      title={
                        isFasilHanifudin(rekap.fasilitator?.namaLengkap)
                          ? "Edit Honor Manual (Fitur Khusus Hanifudin - Tanpa Jam & Transport)"
                          : "Edit Honor Manual"
                      }
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                  {isFasilHanifudin(rekap.fasilitator?.namaLengkap) ? (
                    <span className="inline-block text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded mt-0.5">
                      Manual Khusus
                    </span>
                  ) : null}
                </td>

                {/* 6. Status */}
                <td className="py-3 px-2 align-top text-center whitespace-nowrap">
                  <Badge 
                    variant={rekap.status === 'SUBMITTED' ? 'default' : 'secondary'}
                    className={rekap.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold text-[11px]' : 'text-[11px]'}
                  >
                    {rekap.status}
                  </Badge>
                </td>

                {/* 7. Total Transport */}
                <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-medium text-slate-900">{formatCurrency(hitungTotalTransportRekap(rekap))}</span>
                    <button 
                      type="button"
                      onClick={() => openEditTransportModal(rekap)}
                      className="p-1 hover:bg-amber-100 bg-amber-50 text-amber-700 border border-amber-200 rounded transition-colors cursor-pointer"
                      title="Edit Biaya Transport"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                  {isFasilHanifudin(rekap.fasilitator?.namaLengkap) && hitungTotalTransportRekap(rekap) === 0 ? (
                    <span className="inline-block text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded mt-0.5">
                      Tanpa Transport (Rp 0)
                    </span>
                  ) : hitungTotalTransportRekap(rekap) === 0 ? (
                    <span className="inline-block text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded mt-0.5">
                      Daring (Rp 0)
                    </span>
                  ) : rekap.totalTransport !== null && rekap.totalTransport !== undefined ? (
                    <span className="text-[10px] text-amber-600 font-medium block mt-0.5">Disesuaikan Admin</span>
                  ) : null}
                </td>

                {/* 8. Bukti Bayar & Dokumen Lampiran */}
                <td className="py-3 px-3 align-top text-center">
                  <div className="flex flex-col items-center gap-1.5 min-w-[95px]">
                    {rekap.buktiPembayaranHonor &&
                    rekap.buktiPembayaranTransport &&
                    rekap.buktiPembayaranHonor === rekap.buktiPembayaranTransport ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewModal({
                            isOpen: true,
                            title: `Bukti Transfer (Honor & Transport) - ${rekap.fasilitator?.namaLengkap || 'Fasilitator'} (${rekap.bulan})`,
                            url: rekap.buktiPembayaranHonor,
                          })
                        }
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-full justify-center transition-colors"
                        title="Bukti Transfer Gabungan Honorarium & Transportasi"
                      >
                        ✓ Bukti Transfer
                      </button>
                    ) : (
                      <>
                        {rekap.buktiPembayaranHonor ? (
                          <button 
                            type="button"
                            onClick={() => setPreviewModal({
                              isOpen: true,
                              title: `Bukti Transfer Honor - ${rekap.fasilitator?.namaLengkap || 'Fasilitator'} (${rekap.bulan})`,
                              url: rekap.buktiPembayaranHonor
                            })}
                            className="text-xs text-emerald-700 hover:text-emerald-900 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-full justify-center transition-colors"
                          >
                            ✓ Honor
                          </button>
                        ) : null}
                        {rekap.buktiPembayaranTransport ? (
                          <button 
                            type="button"
                            onClick={() => setPreviewModal({
                              isOpen: true,
                              title: `Bukti Transfer Transport - ${rekap.fasilitator?.namaLengkap || 'Fasilitator'} (${rekap.bulan})`,
                              url: rekap.buktiPembayaranTransport
                            })}
                            className="text-xs text-purple-700 hover:text-purple-900 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer bg-purple-50 px-2 py-0.5 rounded border border-purple-200 w-full justify-center transition-colors"
                          >
                            ✓ Transport
                          </button>
                        ) : null}
                      </>
                    )}
                    {rekap.filePdf ? (
                      <button 
                        type="button"
                        onClick={() => setPreviewModal({
                          isOpen: true,
                          title: `Dokumen PDF TTD - ${rekap.fasilitator?.namaLengkap || 'Fasilitator'} (${rekap.bulan})`,
                          url: rekap.filePdf
                        })}
                        className="text-xs text-blue-700 hover:text-blue-900 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200 w-full justify-center transition-colors"
                      >
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span>PDF TTD</span>
                      </button>
                    ) : null}
                    {(rekap.status === 'SUBMITTED' || rekap.status === 'APPROVED') && (
                      <>
                        <button 
                          type="button"
                          onClick={() => openUploadBuktiModal(rekap)}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2 py-0.5 rounded transition-colors font-medium cursor-pointer w-full mt-0.5"
                        >
                          {rekap.buktiPembayaranHonor && (hitungTotalTransportRekap(rekap) <= 0 || rekap.buktiPembayaranTransport) ? 'Ganti Bukti' : 'Upload Bukti'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setWaModalState({ isOpen: true, rekap, postUploadInfo: null })}
                          className="inline-flex items-center justify-center gap-1 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded transition-colors font-semibold cursor-pointer w-full"
                          title="Kirim / Salin Rincian Pembayaran ke WhatsApp Fasilitator"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>Kirim WA</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>

                {/* 9. Aksi */}
                <td className="py-3 px-3 align-top text-right">
                  {(rekap.status === 'SUBMITTED' || rekap.status === 'APPROVED') && (
                    <div className="flex flex-col gap-1.5 w-32 ml-auto">
                      <button 
                        type="button"
                        onClick={() => openKopModal(rekap)}
                        disabled={loadingId === rekap.id}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-slate-900 text-white hover:bg-slate-800 rounded-md px-2 py-1.5 font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                        title="Buat invoice dan cetak dokumen rekap honorarium"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{loadingId === rekap.id ? 'Memproses...' : 'Invoice & Cetak'}</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => openEditTransportModal(rekap)} 
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer" 
                        title="Edit Biaya Transport Rekap"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Transport</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleCopyText(rekap)} 
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer" 
                        title="Salin rincian data pembayaran ke clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Data</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleSync(rekap.id)} 
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer" 
                        title="Tautkan laporan mingguan fasilitator yang telat ke rekap ini (Tidak merubah honor)"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Tautkan</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleDelete(rekap.id)} 
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer"
                        title="Hapus Rekapitulasi Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
        {items.length > 0 && (
          <tfoot className="bg-slate-100/90 border-t-2 font-mono font-bold text-xs sticky bottom-0 z-10 shadow-xs">
            <tr>
              <td colSpan={showMonthColumn ? 3 : 2} className="py-3 px-4 text-right uppercase text-slate-900 font-sans font-bold">
                Subtotal ({items.length} Fasilitator):
              </td>
              <td className="py-3 px-2 text-center text-slate-900 font-bold">
                {items.reduce((s, it) => s + (it.totalJP || 0), 0)} JP
              </td>
              <td className="py-3 px-3 text-right text-slate-900 font-bold">
                {formatCurrency(items.reduce((s, it) => s + (it.totalHonor || 0), 0))}
              </td>
              <td className="py-3 px-2 text-center text-[11px] font-sans">
                <span className="text-emerald-700 font-bold">
                  {items.filter(it => getRekapPaymentStatus(it) === 'LUNAS').length} Lunas
                </span>
                {items.some(it => getRekapPaymentStatus(it) !== 'LUNAS') && (
                  <span className="text-amber-700 font-medium ml-1">
                    ({items.filter(it => getRekapPaymentStatus(it) !== 'LUNAS').length} proses)
                  </span>
                )}
              </td>
              <td className="py-3 px-3 text-right text-slate-900 font-bold">
                {formatCurrency(items.reduce((s, it) => s + hitungTotalTransportRekap(it), 0))}
              </td>
              <td colSpan={2} className="py-3 px-3 text-right font-sans">
                <span className="text-[11px] text-slate-500 mr-2 font-medium">Total Transfer:</span>
                <span className="text-emerald-950 font-black text-sm">
                  {formatCurrency(items.reduce((s, it) => s + (it.totalHonor || 0) + hitungTotalTransportRekap(it), 0))}
                </span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rekap Honorarium Bulanan</h1>
          <p className="text-slate-500 mt-1">Daftar rekapitulasi honorarium yang diajukan oleh Fasilitator.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            onClick={() => handleOpenExportModal()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Export PDF Rincian dan Kebutuhan Honorarium & Transport per Bulan"
          >
            <FileDown className="w-4 h-4" />
            <span>Export PDF Bulanan</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setBatchTransportBulan(availableRekapMonths[0] || '2026-10');
              setShowBatchTransportModal(true);
            }}
            className="bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-2 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Kalkulasi transport massal menggunakan rumus BBM dan batas maksimal untuk seluruh fasilitator"
          >
            <Fuel className="w-4 h-4" />
            <span>Atur Transport (BBM & Plafon)</span>
          </button>

          <button 
            type="button"
            onClick={() => setShowBulkCopyModal(true)}
            className="bg-indigo-700 hover:bg-indigo-800 text-white px-3.5 py-2 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Salin rekapitulasi seluruh fasilitator dari bulan sebelumnya dengan penyesuaian jumlah pertemuan baru"
          >
            <Sparkles className="w-4 h-4" />
            <span>Salin dari Bulan Lalu</span>
          </button>
          <button 
            onClick={() => setShowManualForm(!showManualForm)}
            className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 cursor-pointer font-medium text-xs"
          >
            {showManualForm ? 'Batal' : '+ Buat Rekap Manual'}
          </button>
        </div>
      </div>

      {/* STATS SUMMARY BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 block">Total Rekapitulasi</span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">{stats.totalCount} Data</span>
          <span className="text-[11px] text-slate-500">{stats.monthCount} periode bulan tercatat</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-emerald-800 block">Selesai Dibayar (Lunas)</span>
          <span className="text-xl font-bold text-emerald-900 mt-0.5 block">{stats.lunasCount} Rekap</span>
          <span className="text-[11px] text-emerald-700 font-medium">Bukti transfer sudah lengkap</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-amber-800 block">Belum Dibayar / Proses</span>
          <span className="text-xl font-bold text-amber-900 mt-0.5 block">{stats.unpaidCount} Rekap</span>
          <span className="text-[11px] text-amber-700 font-medium">Draft / Belum ada bukti transfer</span>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-indigo-800 block">Total Pengeluaran Rekap</span>
          <span className="text-xl font-bold text-indigo-950 mt-0.5 block font-mono">{formatCurrency(stats.grandTotal)}</span>
          <span className="text-[11px] text-indigo-700">Honor: {formatCurrency(stats.totalHonor)} | Trans: {formatCurrency(stats.totalTransport)}</span>
        </div>
      </div>

      {showManualForm && (
        <Card className="mb-6 border-blue-200">
          <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
            <CardTitle className="text-blue-900 text-lg">Buat Rekap Manual Tanpa Laporan</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                <div>
                  <label className="block text-sm font-medium mb-1">Fasilitator</label>
                  <select 
                    required 
                    className="w-full border rounded p-2" 
                    value={manualFasilId} 
                    onChange={e => {
                      const val = e.target.value;
                      setManualFasilId(val);
                      setLastCopiedPrev(null);
                      const fObj = fasilitators.find((f: any) => f.id === val);
                      if (isFasilHanifudin(fObj?.namaLengkap)) {
                        setManualTransport('0');
                        if (!manualHonor) setManualHonor('3120000');
                      }
                    }}
                  >
                    <option value="">Pilih Fasilitator...</option>
                    {fasilitators.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.namaLengkap} - {f.lokasiSNT}</option>
                    ))}
                  </select>
                </div>
                  
                <div>
                  <label className="block text-sm font-medium mb-1">Bulan (YYYY-MM)</label>
                  <input 
                    type="month" 
                    required 
                    className="w-full border rounded p-2" 
                    value={manualBulan} 
                    onChange={e => {
                      setManualBulan(e.target.value);
                      setLastCopiedPrev(null);
                    }} 
                  />
                </div>
              </div>

              {/* SPECIAL BANNER FOR MUH. HANIFUDIN H, S.PD */}
              {(() => {
                const fObj = fasilitators.find((f: any) => f.id === manualFasilId);
                if (!isFasilHanifudin(fObj?.namaLengkap)) return null;
                return (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3.5 text-xs text-purple-900 shadow-xs flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-purple-950">Fitur Khusus Aktif: Muh. Hanifudin H, S.Pd</div>
                      <div className="text-purple-800 mt-0.5 leading-relaxed">
                        Anda dapat langsung mengisi jumlah honor yang akan dibayarkan pada kolom <strong>Total Honor (Rp)</strong> secara manual tanpa melihat/terikat jam mengajar (JP). Bantuan transport otomatis diset <strong>Rp 0 (Tanpa Transport)</strong>.
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* HELPER BOX: DATA BULAN SEBELUMNYA */}
              {previousRekapForSelectedFasil && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3.5 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
                      <History className="w-4 h-4 text-amber-700" />
                      <span>Data Rekap Sebelumnya Ditemukan ({formatBulanIndo(previousRekapForSelectedFasil.bulan)})</span>
                    </div>
                    <div className="text-amber-900">
                      Bulan {formatBulanIndo(previousRekapForSelectedFasil.bulan)}:{' '}
                      <span className="font-bold">{previousRekapForSelectedFasil.jumlahSesi || 3} Pertemuan</span> &bull;{' '}
                      <span className="font-bold">{previousRekapForSelectedFasil.totalJPIntra || 0} JP Intra</span> +{' '}
                      <span className="font-bold">{previousRekapForSelectedFasil.totalJPEkstra || 0} JP Ekstra</span> ({previousRekapForSelectedFasil.totalJP} JP Total) &bull;{' '}
                      Honor: <span className="font-bold">{formatCurrency(previousRekapForSelectedFasil.totalHonor)}</span>
                    </div>
                    <div className="text-[11px] text-amber-800">
                      Rata-rata: {((previousRekapForSelectedFasil.totalJPIntra || 0) / (previousRekapForSelectedFasil.jumlahSesi || 1)).toFixed(1).replace('.0', '')} JP Intra + {((previousRekapForSelectedFasil.totalJPEkstra || 0) / (previousRekapForSelectedFasil.jumlahSesi || 1)).toFixed(1).replace('.0', '')} JP Ekstra per pertemuan.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApplyPreviousData(previousRekapForSelectedFasil, true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold transition-colors shadow-xs cursor-pointer text-xs"
                      title={`Salin data JP dan hitung proporsional untuk ${manualSesi} pertemuan`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gunakan &amp; Sesuaikan ke {manualSesi} Pertemuan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreviousData(previousRekapForSelectedFasil, false)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 rounded-md font-medium transition-colors cursor-pointer text-xs"
                      title="Salin persis angka sesi dan JP bulan lalu tanpa penskalaan"
                    >
                      <span>Salin Persis Sesi Lama</span>
                    </button>
                  </div>
                </div>
              )}

              {lastCopiedPrev && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2 rounded-md text-xs flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Data aktif disesuaikan dari <strong>{formatBulanIndo(lastCopiedPrev.bulan)}</strong> ({lastCopiedPrev.oldSesi} pertemuan). Disesuaikan ke <strong>{manualSesi} pertemuan</strong> ({manualJPIntra} Intra + {manualJPEkstra} Ekstra = {computedTotalJP} JP).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastCopiedPrev(null)}
                    className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-sm p-1"
                    title="Batalkan penggunaan acuan"
                  >
                    &times;
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah Sesi (Pertemuan)</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    className="w-full border rounded p-2" 
                    value={manualSesi} 
                    onChange={e => handleSesiChange(e.target.value)} 
                  />
                  {lastCopiedPrev && (
                    <span className="text-[10px] text-amber-700 block mt-1">
                      💡 JP otomatis menyesuaikan saat jumlah sesi diubah.
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah JP</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-500">JP Intra</label>
                      <input type="number" min="0" className="w-full border rounded p-2" value={manualJPIntra} onChange={e => setManualJPIntra(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">JP Ekstra</label>
                      <input type="number" min="0" className="w-full border rounded p-2" value={manualJPEkstra} onChange={e => setManualJPEkstra(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Total JP</label>
                      <input type="number" readOnly className="w-full border rounded p-2 bg-slate-100 font-bold" value={computedTotalJP} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Honor per JP (Rp)</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualRate} onChange={e => setManualRate(e.target.value)} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">Total Honor (Rp)</label>
                    {(() => {
                      const fObj = fasilitators.find((f: any) => f.id === manualFasilId);
                      return isFasilHanifudin(fObj?.namaLengkap) ? (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                          Khusus Manual
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    value={manualHonor !== '' ? manualHonor : computedTotalHonor} 
                    onChange={e => setManualHonor(e.target.value)}
                    className={`w-full border rounded p-2 font-bold ${
                      (() => {
                        const fObj = fasilitators.find((f: any) => f.id === manualFasilId);
                        return isFasilHanifudin(fObj?.namaLengkap)
                          ? 'border-purple-400 bg-purple-50/50 text-purple-950 focus:ring-purple-500'
                          : 'border-slate-300 bg-slate-100 text-slate-900';
                      })()
                    }`} 
                  />
                  {(() => {
                    const fObj = fasilitators.find((f: any) => f.id === manualFasilId);
                    return isFasilHanifudin(fObj?.namaLengkap) ? (
                      <span className="text-[10px] text-purple-700 font-medium block mt-1">
                        💡 Khusus Muh. Hanifudin: Masukkan jumlah honor manual langsung (bebas dari jam).
                      </span>
                    ) : null;
                  })()}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium">Bantuan Transport (Rp)</label>
                    {manualFasilId && (
                      <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1 py-0.5 rounded">
                        {fasilitators.find((f: any) => f.id === manualFasilId)?.jarakPPKm || 0} km PP
                      </span>
                    )}
                  </div>
                  <input 
                    type="number" 
                    min="0" 
                    className="w-full border rounded p-2" 
                    value={manualTransport} 
                    onChange={e => setManualTransport(e.target.value)} 
                    placeholder="Kosongkan jika auto" 
                  />
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={manualTransport === '0'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setManualTransport('0');
                          } else {
                            setManualTransport('');
                          }
                        }}
                        className="w-4 h-4 mt-0.5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-amber-900 block">Kegiatan Daring (Tanpa Transport / Rp 0)</span>
                        <span className="text-[10.5px] text-amber-700 block">Centang jika kegiatan dilaksanakan full daring. Kwitansi transport tidak digenerate.</span>
                      </div>
                    </label>
                  </div>
                  {manualFasilId && (
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const f = fasilitators.find((fa: any) => fa.id === manualFasilId);
                          const sesi = parseInt(manualSesi) || 4;
                          const calc = hitungTransportDenganRumusBBMDanPlafon({ fasilitator: f, jumlahSesi: sesi }, {
                            useRumusBbm: true,
                            useBatasMaksimal: true,
                            batasMaksimalNominal: 150000
                          });
                          setManualTransport(calc.totalSetelahPlafon.toString());
                        }}
                        className="text-[10.5px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                        title="Hitung dengan rumus jarak BBM dan plafon Rp 150.000/sesi"
                      >
                        ⚡ Hitung BBM &amp; Plafon
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer font-medium"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Munculkan di Tabel'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}


      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-2 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Cari Nama Fasilitator</label>
          <input 
            type="text" 
            placeholder="Ketik nama fasilitator..." 
            value={filterNama}
            onChange={e => setFilterNama(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          />
        </div>
        <div className="w-full md:w-80">
          <label className="text-sm font-medium mb-1 block">Filter Lokasi SNT</label>
          <select 
            value={filterLokasi}
            onChange={e => setFilterLokasi(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Semua Lokasi SNT ({lokasiList.length} Lokasi)</option>
            {lokasiList.map((loc: string) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="text-sm font-medium mb-1 block">Filter Bulan</label>
          <input 
            type="month"
            value={filterBulan}
            onChange={e => setFilterBulan(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          />
        </div>
        {(filterLokasi || filterNama || filterBulan) && (
          <button
            onClick={() => { setFilterLokasi(''); setFilterNama(''); setFilterBulan(''); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 border rounded-lg bg-slate-50 hover:bg-slate-100 whitespace-nowrap"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* TABS & VIEW CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PAID')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PAID'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai Dibayar</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'PAID' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.lunasCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('UNPAID')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'UNPAID'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Belum Dibayar / Proses</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'UNPAID' ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.unpaidCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Data</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'ALL' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.totalCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsGroupedByMonth(!isGroupedByMonth)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isGroupedByMonth 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
            title="Beralih antara tampilan kelompok per bulan atau tabel datar"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{isGroupedByMonth ? 'Mode: Kelompok Per Bulan' : 'Mode: Tabel Flat'}</span>
          </button>

          {isGroupedByMonth && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Buka Semua
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
        <span>Menampilkan <strong>{sortedData.length}</strong> dari <strong>{initialData.length}</strong> rekapitulasi honor</span>
        {filterLokasi && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">Lokasi: {filterLokasi}</span>}
      </div>

      {isGroupedByMonth ? (
        <div className="space-y-5">
          {monthGroups.length === 0 ? (
            <Card className="border-slate-200 shadow-xs">
              <CardContent className="py-12 text-center text-slate-500">
                Tidak ada data rekapitulasi honorarium pada kategori / filter ini.
              </CardContent>
            </Card>
          ) : (
            monthGroups.map((group) => {
              const isCollapsed = !!collapsedMonths[group.bulan];
              return (
                <Card key={group.bulan} className="border-slate-200 shadow-xs overflow-hidden transition-all">
                  <CardHeader 
                    onClick={() => toggleMonth(group.bulan)}
                    className="bg-slate-50/90 border-b border-slate-200 py-3.5 px-4 cursor-pointer hover:bg-slate-100/90 transition-colors select-none"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900">
                              Bulan {group.labelBulan}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs">
                              {group.totalFasilitator} Fasilitator
                            </span>
                            {group.unpaidCount === 0 ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>100% Selesai Dibayar ({group.lunasCount}/{group.totalFasilitator})</span>
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{group.unpaidCount} Perlu Pembayaran</span>
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">
                            Periode: {group.bulan} &bull; Total {group.totalJP} JP
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-right">
                          <div className="hidden sm:block">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Honor</span>
                            <span className="text-xs font-bold text-slate-900">{formatCurrency(group.totalHonor)}</span>
                          </div>
                          <div className="hidden sm:block">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Transport</span>
                            <span className="text-xs font-bold text-slate-900">{formatCurrency(group.totalTransport)}</span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-right">
                            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Total Pengeluaran</span>
                            <span className="text-sm font-black text-emerald-950 font-mono">{formatCurrency(group.grandTotal)}</span>
                          </div>
                        </div>

                        {/* Tombol Export PDF Bulan Ini */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenExportModal(group.bulan);
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          title={`Export PDF Rincian & Kebutuhan untuk bulan ${group.labelBulan}`}
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Export PDF</span>
                        </button>

                        <div className="p-1 rounded-md text-slate-500">
                          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {!isCollapsed && (
                    <CardContent className="p-0">
                      {renderTable(group.items, false)}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardContent className="p-0">
            {renderTable(sortedData, true)}
          </CardContent>
        </Card>
      )}
    
      {/* Modal Pilih Dokumen */}
      
      {/* Modal Upload Bukti Pembayaran */}
      {showUploadModal && uploadingRekap && (() => {
        const transTotal = hitungTotalTransportRekap(uploadingRekap);
        const grandTotalTransfer = (uploadingRekap.totalHonor || 0) + transTotal;
        const normPreviewPhone = normalizeWhatsAppNumber(uploadWaPhone);
        const hasImageSelected = separateReceiptUpload
          ? Boolean(
              (honorFile && honorFile.type.startsWith('image/')) ||
              (transportFile && transportFile.type.startsWith('image/'))
            )
          : Boolean(honorFile && honorFile.type.startsWith('image/'));
        const hasExistingCombined = Boolean(
          uploadingRekap.buktiPembayaranHonor &&
          (!transTotal || uploadingRekap.buktiPembayaranTransport)
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-[540px] max-w-[94vw] max-h-[92vh] flex flex-col my-auto overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Upload Bukti Pembayaran</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {uploadingRekap.fasilitator?.namaLengkap} &bull; Bulan {uploadingRekap.bulan}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <p className="text-xs text-slate-600 bg-blue-50/70 border border-blue-200 rounded-lg px-3 py-2">
                  Setelah diupload, sistem otomatis memotong item <strong>RAB Fasilitator &amp; Sewa Rumah</strong> dan menyiapkan rincian ke WhatsApp Fasilitator.
                </p>

                {!separateReceiptUpload ? (
                  <div className="border border-slate-200 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Bukti Transfer Pembayaran ({formatCurrency(grandTotalTransfer)})
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 shrink-0">
                        1 Bukti Gabungan
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Mencakup Honorarium ({formatCurrency(uploadingRekap.totalHonor)})
                      {transTotal > 0 ? ` + Transportasi (${formatCurrency(transTotal)})` : ' (Tanpa Transportasi)'}
                    </p>
                    {hasExistingCombined ? (
                      <div className="text-xs text-emerald-600 font-semibold">✓ Sudah ada bukti terupload</div>
                    ) : null}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setHonorFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>
                ) : (
                  <>
                    <div className="border border-slate-200 p-3.5 rounded-xl space-y-2">
                      <label className="block text-xs font-bold text-slate-800">
                        1. Bukti Transfer Honorarium ({formatCurrency(uploadingRekap.totalHonor)})
                      </label>
                      {uploadingRekap.buktiPembayaranHonor ? (
                        <div className="text-xs text-emerald-600 font-semibold">✓ Sudah ada bukti terupload</div>
                      ) : null}
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => setHonorFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200 cursor-pointer"
                      />
                    </div>

                    <div className="border border-slate-200 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block text-xs font-bold text-slate-800">
                          2. Bukti Transfer Transportasi ({formatCurrency(transTotal)})
                        </label>
                        {transTotal <= 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            Opsional (Rp 0)
                          </span>
                        )}
                      </div>
                      {uploadingRekap.buktiPembayaranTransport ? (
                        <div className="text-xs text-emerald-600 font-semibold">✓ Sudah ada bukti terupload</div>
                      ) : null}
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => setTransportFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200 cursor-pointer"
                      />
                    </div>
                  </>
                )}

                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none px-1">
                  <input
                    type="checkbox"
                    checked={separateReceiptUpload}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setSeparateReceiptUpload(next);
                      if (!next) {
                        setTransportFile(null);
                      }
                    }}
                    className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                  />
                  <span>Upload bukti Honor &amp; Transport secara terpisah (jika ditransfer dalam 2 transaksi berbeda)</span>
                </label>

                {/* Pengaturan Kirim Otomatis ke WhatsApp Desktop */}
                <div className="border border-emerald-200 bg-emerald-50/40 p-3.5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      Notifikasi WhatsApp Fasilitator
                    </span>
                    {normPreviewPhone ? (
                      <span className="text-[10.5px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        +{normPreviewPhone}
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Nomor WA Belum Valid
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      Nomor WhatsApp Fasilitator (otomatis disimpan jika diubah):
                    </label>
                    <input
                      type="text"
                      value={uploadWaPhone}
                      onChange={(e) => setUploadWaPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={autoLaunchWaAfterUpload}
                      onChange={(e) => setAutoLaunchWaAfterUpload(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>
                      <strong>Otomatis buka WhatsApp Desktop</strong> ke chat fasil dengan rincian nominal, rekening, dan link bukti transfer siap tekan Enter
                    </span>
                  </label>

                  {hasImageSelected && (
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={copyImageAfterUpload}
                        onChange={(e) => setCopyImageAfterUpload(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>
                        <strong>Salin gambar bukti ke clipboard otomatis</strong> agar tinggal tekan <kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">Ctrl+V</kbd> di chat WhatsApp
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-5 py-3.5 border-t bg-slate-50 flex justify-end gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                  disabled={isUploading}
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    if (separateReceiptUpload) {
                      if (!honorFile && !transportFile) {
                        alert('Pilih minimal satu file bukti pembayaran');
                        return;
                      }
                    } else if (!honorFile) {
                      alert('Pilih file bukti pembayaran terlebih dahulu');
                      return;
                    }
                    setIsUploading(true);
                    try {
                      let urlHonor: string | undefined;
                      let urlTransport: string | undefined;
                      if (!separateReceiptUpload && honorFile) {
                        const uploadedUrl = await uploadFileClient(honorFile, 'receipts');
                        urlHonor = uploadedUrl;
                        urlTransport = transTotal > 0 ? uploadedUrl : undefined;
                      } else {
                        if (honorFile) {
                          urlHonor = await uploadFileClient(honorFile, 'receipts');
                        }
                        if (transportFile) {
                          urlTransport = await uploadFileClient(transportFile, 'receipts');
                        }
                      }
                      
                      const result = await uploadBuktiRekap(
                        uploadingRekap.id,
                        urlHonor,
                        urlTransport,
                        uploadWaPhone
                      );
                      if (result.error) throw new Error(result.error);

                      const shortUrlHonor =
                        result.shortUrlHonor ||
                        uploadingRekap.shortUrlHonor ||
                        urlHonor ||
                        uploadingRekap.buktiPembayaranHonor;
                      const shortUrlTransport = !separateReceiptUpload
                        ? (transTotal > 0 ? shortUrlHonor : null)
                        : (result.shortUrlTransport ||
                           uploadingRekap.shortUrlTransport ||
                           urlTransport ||
                           uploadingRekap.buktiPembayaranTransport);

                      const updatedRekapForWa = {
                        ...uploadingRekap,
                        buktiPembayaranHonor: urlHonor || uploadingRekap.buktiPembayaranHonor,
                        buktiPembayaranTransport: urlTransport || uploadingRekap.buktiPembayaranTransport,
                        shortUrlHonor,
                        shortUrlTransport,
                        fasilitator: {
                          ...uploadingRekap.fasilitator,
                          kontak: uploadWaPhone.trim() || uploadingRekap.fasilitator?.kontak,
                        },
                      };

                      const imageFiles = (separateReceiptUpload ? [honorFile, transportFile] : [honorFile]).filter(
                        (f): f is File => Boolean(f && f.type.startsWith('image/'))
                      );
                      let imageCopied = false;
                      if (copyImageAfterUpload && imageFiles.length > 0) {
                        imageCopied = await copyImageFileToClipboard(imageFiles[0]);
                      }

                      let launchedDesktop = false;
                      const normPhone = normalizeWhatsAppNumber(uploadWaPhone);
                      if (autoLaunchWaAfterUpload && normPhone) {
                        const waMsg = buildRekapWhatsAppMessage(updatedRekapForWa, {
                          urlHonor: shortUrlHonor,
                          urlTransport: shortUrlTransport,
                        });
                        launchedDesktop = launchWhatsAppDesktop(normPhone, waMsg);
                      }

                      setShowUploadModal(false);
                      setWaModalState({
                        isOpen: true,
                        rekap: updatedRekapForWa,
                        postUploadInfo: {
                          launchedDesktop,
                          imageCopied,
                          imageFiles,
                          urlHonor: shortUrlHonor,
                          urlTransport: shortUrlTransport,
                        },
                      });
                      router.refresh();
                    } catch (err: any) {
                      console.error(err);
                      alert('Terjadi kesalahan: ' + err.message);
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  disabled={isUploading || (separateReceiptUpload ? (!honorFile && !transportFile) : !honorFile)}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <span>Upload, Potong RAB &amp; Kirim WA</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showKopModal && selectedRekap && (() => {
        const existingInv = getInvHonor(selectedRekap);
        const existingKwH = getKwHonor(selectedRekap);
        const existingKwT = getKwTransport(selectedRekap);

        const hasExistingInv = !!(existingInv?.noInvoice && !existingInv.noInvoice.includes('TEMP'));
        const hasExistingKwH = !!(existingKwH?.noKwitansi && !existingKwH.noKwitansi.includes('TEMP'));
        const hasExistingKwT = !!(existingKwT?.noKwitansi && !existingKwT.noKwitansi.includes('TEMP'));

        const needsInput = 
          (printCheckInvoice && (!hasExistingInv || isUnlockedInvoice)) ||
          (printCheckHonor && (!hasExistingKwH || isUnlockedHonor)) ||
          (printCheckTransport && (!hasExistingKwT || isUnlockedTransport));

        const isAllLocked = 
          (!printCheckInvoice || (hasExistingInv && !isUnlockedInvoice)) &&
          (!printCheckHonor || (hasExistingKwH && !isUnlockedHonor)) &&
          (!printCheckTransport || (hasExistingKwT && !isUnlockedTransport));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Export Dokumen Rekap Honorarium</h3>
                  <p className="text-xs text-slate-500">
                    {selectedRekap.fasilitator?.namaLengkap} &bull; Periode {selectedRekap.bulan}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKopModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Checkboxes Dokumen */}
                <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Pilih Dokumen yang Dicetak:</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={printCheckInvoice} 
                        onChange={e => setPrintCheckInvoice(e.target.checked)} 
                        className="w-4 h-4 text-blue-600 rounded" 
                      />
                      <span>Invoice Honorarium</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={printCheckHonor} 
                        onChange={e => setPrintCheckHonor(e.target.checked)} 
                        className="w-4 h-4 text-emerald-600 rounded" 
                      />
                      <span>Kwitansi Honorarium (Sesi Mengajar)</span>
                    </label>
                    <label className={`flex items-center space-x-2 text-sm ${hitungTotalTransportRekap(selectedRekap) <= 0 ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input 
                        type="checkbox" 
                        checked={printCheckTransport && hitungTotalTransportRekap(selectedRekap) > 0} 
                        disabled={hitungTotalTransportRekap(selectedRekap) <= 0}
                        onChange={e => setPrintCheckTransport(e.target.checked)} 
                        className="w-4 h-4 text-emerald-600 rounded" 
                      />
                      <span>Kwitansi Transport (Bulanan)</span>
                      {hitungTotalTransportRekap(selectedRekap) <= 0 && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded ml-1">
                          Daring / Rp 0 (Tanpa Kwitansi)
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                {/* Status Booking: Invoice */}
                {printCheckInvoice && (
                  hasExistingInv && !isUnlockedInvoice ? (
                    <div className="p-3 border border-blue-200 bg-blue-50/60 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Invoice Honorarium (Nomor Ter-booking)</span>
                        </div>
                        <Badge className="bg-blue-600 text-white text-[10px] font-semibold">Terkunci</Badge>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-blue-200 text-xs space-y-1">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500 font-sans">No. Invoice:</span>
                          <span className="font-bold text-blue-800">{existingInv.noInvoice}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Tanggal Terdaftar:</span>
                          <span className="text-slate-800 font-medium">
                            {new Date(existingInv.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-blue-800/80">Nomor ini telah dibooking permanen.</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (await confirm("Peringatan: Membuat nomor baru akan menghubungi webhook Google Sheets dan menambah baris baru di sheet. Apakah Anda yakin ingin membuka kunci?")) {
                              setIsUnlockedInvoice(true);
                            }
                          }}
                          className="text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Buka Kunci / Generate Baru
                        </button>
                      </div>
                    </div>
                  ) : (
                    isUnlockedInvoice && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
                        <span>⚠️ Nomor Invoice sedang dibuka kuncinya untuk generate nomor baru.</span>
                        <button
                          type="button"
                          onClick={() => setIsUnlockedInvoice(false)}
                          className="underline hover:text-amber-950 font-medium ml-2 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    )
                  )
                )}

                {/* Status Booking: Kwitansi Honor */}
                {printCheckHonor && (
                  hasExistingKwH && !isUnlockedHonor ? (
                    <div className="p-3 border border-emerald-200 bg-emerald-50/60 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <FileCheck2 className="w-4 h-4 text-emerald-600" />
                          <span>Kwitansi Honorarium (Nomor Ter-booking)</span>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">Terkunci</Badge>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-emerald-200 text-xs space-y-1">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500 font-sans">No. Kwitansi:</span>
                          <span className="font-bold text-emerald-800">{existingKwH.noKwitansi}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Tanggal Terdaftar:</span>
                          <span className="text-slate-800 font-medium">
                            {new Date(existingKwH.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-emerald-800/80">Nomor ini telah dibooking permanen.</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (await confirm("Peringatan: Membuat nomor baru akan menghubungi webhook Google Sheets dan menambah baris baru di sheet. Apakah Anda yakin ingin membuka kunci?")) {
                              setIsUnlockedHonor(true);
                            }
                          }}
                          className="text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Buka Kunci / Generate Baru
                        </button>
                      </div>
                    </div>
                  ) : (
                    isUnlockedHonor && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
                        <span>⚠️ Nomor Kwitansi Honor sedang dibuka kuncinya untuk generate baru.</span>
                        <button
                          type="button"
                          onClick={() => setIsUnlockedHonor(false)}
                          className="underline hover:text-amber-950 font-medium ml-2 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    )
                  )
                )}

                {/* Status Booking: Kwitansi Transport */}
                {printCheckTransport && (
                  hasExistingKwT && !isUnlockedTransport ? (
                    <div className="p-3 border border-emerald-200 bg-emerald-50/60 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <FileCheck2 className="w-4 h-4 text-emerald-600" />
                          <span>Kwitansi Transport (Nomor Ter-booking)</span>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">Terkunci</Badge>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-emerald-200 text-xs space-y-1">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500 font-sans">No. Kwitansi:</span>
                          <span className="font-bold text-emerald-800">{existingKwT.noKwitansi}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Tanggal Terdaftar:</span>
                          <span className="text-slate-800 font-medium">
                            {new Date(existingKwT.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-emerald-800/80">Nomor ini telah dibooking permanen.</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (await confirm("Peringatan: Membuat nomor baru akan menghubungi webhook Google Sheets dan menambah baris baru di sheet. Apakah Anda yakin ingin membuka kunci?")) {
                              setIsUnlockedTransport(true);
                            }
                          }}
                          className="text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Buka Kunci / Generate Baru
                        </button>
                      </div>
                    </div>
                  ) : (
                    isUnlockedTransport && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
                        <span>⚠️ Nomor Kwitansi Transport sedang dibuka kuncinya untuk generate baru.</span>
                        <button
                          type="button"
                          onClick={() => setIsUnlockedTransport(false)}
                          className="underline hover:text-amber-950 font-medium ml-2 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    )
                  )
                )}

                {/* Pilih Kop Surat (Khusus Invoice) */}
                {printCheckInvoice && (
                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-xs font-semibold text-slate-700 block">Pilih Kop Surat (Khusus Invoice):</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-1.5 text-xs cursor-pointer">
                        <input 
                          type="radio" 
                          name="kopTypeRekap" 
                          checked={printKopType === 'maleo'} 
                          onChange={() => setPrintKopType('maleo')} 
                          className="w-3.5 h-3.5 text-blue-600" 
                        />
                        <span>Yayasan Maleo</span>
                      </label>
                      <label className="flex items-center space-x-1.5 text-xs cursor-pointer">
                        <input 
                          type="radio" 
                          name="kopTypeRekap" 
                          checked={printKopType === 'robotic'} 
                          onChange={() => setPrintKopType('robotic')} 
                          className="w-3.5 h-3.5 text-blue-600" 
                        />
                        <span>Robotic Explorer</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Input jika ada dokumen yang belum terbooking atau sedang dibuka kunci */}
                {needsInput && (
                  <div className="space-y-3 pt-3 border-t">
                    <label className="text-xs font-semibold text-slate-800 block">
                      Konfigurasi Generate Nomor Baru
                    </label>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nomor Urut <span className="text-slate-400 font-normal">(Kosongkan untuk nomor otomatis Sheets)</span>
                      </label>
                      <input 
                        type="text" 
                        value={inputNoUrut}
                        onChange={(e) => setInputNoUrut(e.target.value)}
                        placeholder="Contoh: 001, 002... (atau kosongkan)"
                        className="w-full border rounded-md px-3 py-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Tanggal Dokumen <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        value={inputTanggal}
                        onChange={(e) => setInputTanggal(e.target.value)}
                        className="w-full border rounded-md px-3 py-1.5 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end items-center gap-2 pt-3 border-t">
                <button 
                  type="button"
                  onClick={() => setShowKopModal(false)} 
                  className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  disabled={isGeneratingPdf}
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={generatePdfDirect}
                  disabled={isGeneratingPdf || (!printCheckInvoice && !printCheckHonor && !printCheckTransport)}
                  className="px-4 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>
                      {isAllLocked 
                        ? 'Export PDF (No. Tersimpan)' 
                        : 'Export PDF (Generate Baru)'
                      }
                    </span>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    if (!selectedRekap) return;
                    setIsGeneratingPdf(true);
                    try {
                      let htmlString = "";
                      
                      if (printCheckInvoice) {
                        const forceNewInv = isUnlockedInvoice;
                        const invRecord = await generateInvoiceHonorRecord(
                          selectedRekap.id, 
                          isUnlockedInvoice ? inputNoUrut : undefined, 
                          isUnlockedInvoice ? inputTanggal : undefined, 
                          forceNewInv
                        );
                        if (invRecord?.error) throw new Error(invRecord.error);
                        htmlString += getInvoiceHtml(selectedRekap, printKopType, invRecord);
                      }
                      
                      if (printCheckHonor) {
                        const forceNewKw = isUnlockedHonor;
                        const record = await generateKwitansiHonor(
                          selectedRekap.id, 
                          isUnlockedHonor ? inputNoUrut : undefined, 
                          isUnlockedHonor ? inputTanggal : undefined, 
                          forceNewKw
                        );
                        if (record.error) throw new Error(record.error);
                        htmlString += getKwitansiHtml(selectedRekap, record, 'HONOR', terbilangRupiah);
                      }
                      
                      let transportNoUrut = isUnlockedTransport ? inputNoUrut : undefined;
                      if (isUnlockedTransport && printCheckHonor && inputNoUrut) {
                        const num = parseInt(inputNoUrut, 10);
                        if (!isNaN(num)) transportNoUrut = (num + 1).toString();
                        else transportNoUrut = inputNoUrut + "-T";
                      }
                      
                      if (printCheckTransport) {
                        const forceNewTrans = isUnlockedTransport;
                        const record = await generateKwitansiTransportBulanan(
                          selectedRekap.id, 
                          transportNoUrut, 
                          isUnlockedTransport ? inputTanggal : undefined, 
                          forceNewTrans
                        );
                        if (record.error) throw new Error(record.error);
                        htmlString += getKwitansiHtml(selectedRekap, record, 'TRANSPORT', terbilangRupiah);
                      }
                      
                      if (!htmlString) {
                        alert("Pilih minimal 1 dokumen untuk dicetak.");
                        setIsGeneratingPdf(false);
                        return;
                      }

                      const printWindow = window.open('', '_blank');
                      if (!printWindow) {
                        alert("Popup diblokir! Izinkan popup untuk memprint.");
                        setIsGeneratingPdf(false);
                        return;
                      }
                      
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Print Dokumen - ${selectedRekap.fasilitator?.namaLengkap} - ${selectedRekap.bulan}</title>
                            <style>
                              @media print {
                                body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                              }
                            </style>
                          </head>
                          <body style="margin: 0; padding: 0;">
                            ${htmlString}
                            <script>
                              window.onload = () => {
                                setTimeout(() => {
                                  window.print();
                                }, 500);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      setShowKopModal(false);
                      router.refresh();
                    } catch (err: any) {
                      console.error('GENERATE PRINT ERROR', err, err.stack);
                      alert("Gagal print: " + err.message);
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                  disabled={isGeneratingPdf || (!printCheckInvoice && !printCheckHonor && !printCheckTransport)}
                  className="px-4 py-2 text-xs bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghubungkan ke Sheets...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>
                        {isAllLocked 
                          ? 'Cetak Dokumen (Gunakan No. Tersimpan)' 
                          : 'Generate Nomor & Cetak Sekarang'
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showTextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[450px]">
              <h3 className="text-lg font-bold mb-4">Detail Data Pembayaran</h3>
              <p className="text-sm text-slate-500 mb-2">Teks berikut siap disalin atau dibagikan:</p>
              <textarea 
                readOnly 
                className="w-full h-48 p-3 text-sm font-mono border rounded-md bg-slate-50 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={textToCopy}
              />
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowTextModal(false)} 
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(textToCopy);
                    alert("Teks berhasil disalin ke clipboard!");
                  }} 
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Salin Teks
                </button>
              </div>
            </div>
          </div>
        )}
      
      {/* Modal Edit Honor Manual Khusus */}
      {showEditHonorModal && editingHonorRekap && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col my-auto overflow-hidden">
            {/* Header Sticky */}
            <div className="flex justify-between items-center px-5 py-3.5 border-b bg-purple-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-700 text-white rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Edit Honor Manual {isFasilHanifudin(editingHonorRekap.fasilitator?.namaLengkap) ? '(Fitur Khusus)' : ''}
                  </h3>
                  <p className="text-xs text-purple-700 font-semibold mt-0.5">
                    {editingHonorRekap.fasilitator?.namaLengkap} &bull; Bulan {editingHonorRekap.bulan}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowEditHonorModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg text-lg font-bold transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Highlight Info Box */}
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-purple-950 text-xs">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Pengisian Honor Manual Tanpa Terikat Jam &amp; Transport</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  {isFasilHanifudin(editingHonorRekap.fasilitator?.namaLengkap)
                    ? 'Fitur khusus untuk Fasil Muh. Hanifudin H, S.Pd: Admin dapat langsung mengisi jumlah nominal honor yang akan dibayarkan secara manual. Perhitungan jam mengajar (JP) dilewati dan biaya transport otomatis diset Rp 0.'
                    : 'Admin dapat mengubah nominal total honor secara manual sesuai kesepakatan khusus.'}
                </p>
              </div>

              {/* Data Rekap Saat Ini */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500 block">Jam Terdaftar (JP):</span>
                  <span className="font-bold text-slate-800">
                    {editingHonorRekap.totalJP} JP ({editingHonorRekap.totalJPIntra || 0} Intra / {editingHonorRekap.totalJPEkstra || 0} Ekstra)
                  </span>
                  <span className="text-[10px] text-purple-600 font-medium block mt-0.5">💡 Tidak mempengaruhi honor</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jumlah Sesi &amp; Lokasi:</span>
                  <span className="font-bold text-slate-800">{editingHonorRekap.jumlahSesi || 4} Sesi</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{editingHonorRekap.fasilitator?.lokasiSNT || '-'}</span>
                </div>
              </div>

              {/* Input Nominal Honor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Nominal Total Honor yang Akan Dibayarkan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    Rp
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={honorAmountInput}
                    onChange={(e) => setHonorAmountInput(e.target.value)}
                    placeholder="Contoh: 3120000"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-mono font-bold text-slate-900 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-purple-50/20"
                  />
                </div>
                {honorAmountInput && !isNaN(Number(honorAmountInput)) && (
                  <div className="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-700 font-medium space-y-0.5">
                    <div>Format: <strong className="text-purple-900 font-mono text-sm">{formatCurrency(Number(honorAmountInput))}</strong></div>
                    <div className="text-[11px] text-slate-500 italic">Terbilang: {terbilangRupiah(Number(honorAmountInput))}</div>
                  </div>
                )}
              </div>

              {/* Quick Presets */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block">Pilihan Cepat Nominal:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[2500000, 3000000, 3120000, 3500000, 4000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setHonorAmountInput(amt.toString())}
                      className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700 rounded border border-slate-200 transition-colors cursor-pointer"
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opsi Tanpa Transport */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={honorZeroTransport}
                    onChange={(e) => setHonorZeroTransport(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Tanpa Transport (Tetapkan Bantuan Transport Rp 0)</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Fasilitator hanya menerima honor murni tanpa bantuan transport. Kwitansi transport tidak akan dibuat.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer Sticky */}
            <div className="px-5 py-3.5 border-t bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowEditHonorModal(false)}
                disabled={isSavingHonor}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveHonorManual}
                disabled={isSavingHonor}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingHonor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Simpan Honor Manual</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Edit Transport Rekap */}
      {editingTransportRekap && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col my-auto overflow-hidden">
            {/* Header Sticky */}
            <div className="flex justify-between items-center px-5 py-3.5 border-b bg-white shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Edit Biaya Transport Rekap</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingTransportRekap.fasilitator?.namaLengkap} &bull; Bulan {editingTransportRekap.bulan}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingTransportRekap(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg text-lg font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="px-5 py-4 overflow-y-auto space-y-3.5 flex-1">
              <div className="p-2.5 bg-slate-50 border rounded-lg text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10.5px]">Standar Fasilitator:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(editingTransportRekap.fasilitator?.besaranTransport || 120000)} / sesi</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10.5px]">Jumlah Pertemuan:</span>
                  <span className="font-semibold text-slate-800">{editingTransportRekap.jumlahSesi || 4} Sesi ({editingTransportRekap.laporan?.length || 0} Terlapor)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10.5px]">Jarak Kedudukan:</span>
                  <span className="font-semibold text-indigo-700">{editingTransportRekap.fasilitator?.jarakPPKm || 0} km Pulang-Pergi</span>
                </div>
                {editingTransportRekap.totalTransport !== null && editingTransportRekap.totalTransport !== undefined && (
                  <div className="col-span-full text-amber-700 font-medium pt-1 border-t text-[11px]">
                    Status: Nominal saat ini telah disesuaikan manual oleh Admin.
                  </div>
                )}
              </div>

              {/* Kalkulator Rumus BBM & Batas Maksimal */}
              {(() => {
                const editJarak = Number(editingTransportRekap.fasilitator?.jarakPPKm) || 0;
                const editSesi = Number(editingTransportRekap.jumlahSesi) || 4;
                const editSbm = Number(editingTransportRekap.fasilitator?.besaranTransport) || 120000;
                const editHarga = parseFloat(editHargaBbm) || globalHargaBbm || 16300;
                const editKons = parseFloat(editKonsumsi) || 10;

                // Data Laporan Mingguan yang Sudah Masuk
                const laporanList: any[] = editingTransportRekap.laporan || [];
                const jumlahTerlapor = laporanList.length;
                const totalTerlapor = laporanList.reduce((sum: number, lap: any) => sum + hitungTransportSesi(lap, editingTransportRekap.fasilitator, editHarga), 0);
                const jumlahSisa = Math.max(0, editSesi - jumlahTerlapor);
                
                // Rumus BBM Dasar = (Jarak / Konsumsi) * Harga BBM
                const editBbmDasar = Math.round((editJarak / editKons) * editHarga);
                // Rumus BBM + 20%
                const editBbmMurniPerSesi = Math.round(editBbmDasar * 1.20);
                
                // 1. Sisa Sesi dihitung BBM Murni atau Standar SBM
                const totalSisaBbmMurni = jumlahSisa * editBbmMurniPerSesi;
                const totalSisaSbm = jumlahSisa * editSbm;

                // 2. Kombinasi Hibrida: Sesuai Laporan + Sisa Sesi
                const totalHibridaBbm = totalTerlapor + totalSisaBbmMurni;
                const totalHibridaSbm = totalTerlapor + totalSisaSbm;

                // 3. Flat Penuh (Semua sesi tanpa melihat laporan)
                const editTotalBbmMurniFlat = editBbmMurniPerSesi * editSesi;
                const editTotalSbmFlat = editSbm * editSesi;

                // Plafon Capping
                let finalHibridaBbm = totalHibridaBbm;
                let finalHibridaSbm = totalHibridaSbm;
                let finalFlatBbm = editTotalBbmMurniFlat;
                let finalFlatSbm = editTotalSbmFlat;
                let isCapped = false;

                if (editUseMax && editMaxNominal) {
                  const maxVal = parseFloat(editMaxNominal) || 0;
                  if (editMaxType === 'TOTAL') {
                    if (finalHibridaBbm > maxVal) { finalHibridaBbm = maxVal; isCapped = true; }
                    if (finalHibridaSbm > maxVal) { finalHibridaSbm = maxVal; isCapped = true; }
                    if (finalFlatBbm > maxVal) { finalFlatBbm = maxVal; isCapped = true; }
                    if (finalFlatSbm > maxVal) { finalFlatSbm = maxVal; isCapped = true; }
                  } else {
                    const maxTotal = maxVal * editSesi;
                    if (finalHibridaBbm > maxTotal) { finalHibridaBbm = maxTotal; isCapped = true; }
                    if (finalHibridaSbm > maxTotal) { finalHibridaSbm = maxTotal; isCapped = true; }
                    if (finalFlatBbm > maxTotal) { finalFlatBbm = maxTotal; isCapped = true; }
                    if (finalFlatSbm > maxTotal) { finalFlatSbm = maxTotal; isCapped = true; }
                  }
                }

                return (
                  <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                        <Fuel className="w-4 h-4 text-indigo-600" />
                        <span>Kalkulator Rumus BBM &amp; Plafon</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-indigo-900 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-2xs" title="Harga BBM tersinkron dari Pengaturan Akun">
                          BBM: Rp {editHarga.toLocaleString('id-ID')}/L
                        </span>
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                          {editJarak} km PP &bull; {editSesi} Pertemuan
                        </span>
                      </div>
                    </div>

                    {/* Banner Deteksi Laporan Mingguan */}
                    {jumlahTerlapor > 0 && (
                      <div className="bg-emerald-50/90 border border-emerald-300 rounded-lg p-2.5 text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                            Terdeteksi {jumlahTerlapor} Laporan Mingguan
                          </span>
                          <span className="text-[11px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                            {jumlahTerlapor} Sesi Terlapor = Rp {totalTerlapor.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-emerald-800 leading-relaxed">
                          {jumlahTerlapor} sesi dihitung sesuai laporan (<strong>Rp {totalTerlapor.toLocaleString('id-ID')}</strong>). Sisa <strong>{jumlahSisa} sesi belum ada laporan</strong> dapat dipilih menggunakan tarif BBM Murni atau Standar SBM di bawah.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Box 1: BBM Murni (+20%) */}
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-800 font-semibold text-[11px]">Rumus BBM Murni:</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold font-mono">+20%</span>
                        </div>
                        <div className="font-bold text-emerald-900 text-sm mt-0.5">
                          Rp {editBbmMurniPerSesi.toLocaleString('id-ID')}
                          <span className="text-[10px] font-normal text-slate-500"> / pertemuan</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Dasar: ({editJarak} km / 10) &times; Rp {editHarga.toLocaleString('id-ID')} = Rp {editBbmDasar.toLocaleString('id-ID')} (+20%)
                        </span>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[11px] text-emerald-700 font-medium">
                          {jumlahSisa > 0 ? (
                            <span>Sisa {jumlahSisa} sesi = <strong>Rp {totalSisaBbmMurni.toLocaleString('id-ID')}</strong></span>
                          ) : (
                            <span>Total {editSesi} sesi = <strong>Rp {editTotalBbmMurniFlat.toLocaleString('id-ID')}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Box 2: Standar SBM Lokal */}
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                        <span className="text-slate-600 font-medium block text-[11px]">Standar SBM Lokal:</span>
                        <div className="font-bold text-slate-800 text-sm mt-0.5">
                          Rp {editSbm.toLocaleString('id-ID')}
                          <span className="text-[10px] font-normal text-slate-500"> / pertemuan</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Standar wajar minimum wilayah</span>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                          {jumlahSisa > 0 ? (
                            <span>Sisa {jumlahSisa} sesi = <strong>Rp {totalSisaSbm.toLocaleString('id-ID')}</strong></span>
                          ) : (
                            <span>Total {editSesi} sesi = <strong>Rp {editTotalSbmFlat.toLocaleString('id-ID')}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Opsi Batas Maksimal (Plafon) */}
                    <div className="pt-2 border-t border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-slate-800 font-medium cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={editUseMax} 
                            onChange={e => setEditUseMax(e.target.checked)} 
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                          <span>Gunakan Batas Maksimal</span>
                        </label>
                        {editUseMax && (
                          <select 
                            value={editMaxType} 
                            onChange={e => setEditMaxType(e.target.value as any)} 
                            className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-700 font-medium"
                          >
                            <option value="PER_SESI">Per Pertemuan</option>
                            <option value="TOTAL">Total Bulanan</option>
                          </select>
                        )}
                      </div>

                      {editUseMax && (
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-indigo-100">
                          <span className="text-xs text-slate-600 whitespace-nowrap">Plafon Maks: Rp</span>
                          <input 
                            type="number" 
                            value={editMaxNominal} 
                            onChange={e => setEditMaxNominal(e.target.value)} 
                            className="w-full text-xs font-bold border rounded px-2 py-1 bg-white focus:ring-1 focus:ring-indigo-500" 
                            placeholder="150000"
                          />
                        </div>
                      )}

                      {isCapped && (
                        <div className="text-[10.5px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-1.5 font-medium">
                          ⚠️ Terpotong plafon maksimal sesuai batas yang ditentukan.
                        </div>
                      )}
                    </div>

                    {/* Tombol Opsi Terapkan */}
                    <div className="pt-2 space-y-2">
                      {jumlahTerlapor > 0 && jumlahSisa > 0 ? (
                        <>
                          <span className="text-[10.5px] font-bold text-slate-700 block">
                            Pilih Opsi Pengisian Cepat (Sesuai Laporan + Sisa Sesi):
                          </span>

                          {/* Tombol 1: Hibrida BBM Murni (Rekomendasi Utama) */}
                          <button
                            type="button"
                            onClick={() => setTransportAmountInput(finalHibridaBbm.toString())}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl border-2 border-emerald-600 bg-emerald-50/90 hover:bg-emerald-100 transition cursor-pointer text-left shadow-2xs group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                                <Fuel className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-emerald-950">
                                    ⚡ {jumlahTerlapor} Laporan + {jumlahSisa} Sesi BBM Murni (+20%)
                                  </span>
                                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">Rekomendasi</span>
                                </div>
                                <span className="text-[10.5px] text-emerald-800 block">
                                  {jumlahTerlapor} Laporan (Rp {totalTerlapor.toLocaleString('id-ID')}) + {jumlahSisa} Sisa @ Rp {editBbmMurniPerSesi.toLocaleString('id-ID')} (Rp {totalSisaBbmMurni.toLocaleString('id-ID')})
                                </span>
                              </div>
                            </div>
                            <div className="text-right pl-2 shrink-0">
                              <span className="text-sm font-black text-emerald-900 block">
                                Rp {finalHibridaBbm.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold group-hover:underline">Pilih &rarr;</span>
                            </div>
                          </button>

                          {/* Tombol 2: Hibrida Standar SBM */}
                          <button
                            type="button"
                            onClick={() => setTransportAmountInput(finalHibridaSbm.toString())}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 transition cursor-pointer text-left shadow-2xs group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-indigo-950">
                                  {jumlahTerlapor} Laporan + {jumlahSisa} Sesi Standar SBM
                                </div>
                                <span className="text-[10.5px] text-indigo-800 block">
                                  {jumlahTerlapor} Laporan (Rp {totalTerlapor.toLocaleString('id-ID')}) + {jumlahSisa} Sisa @ Rp {editSbm.toLocaleString('id-ID')} (Rp {totalSisaSbm.toLocaleString('id-ID')})
                                </span>
                              </div>
                            </div>
                            <div className="text-right pl-2 shrink-0">
                              <span className="text-sm font-bold text-indigo-950 block">
                                Rp {finalHibridaSbm.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[10px] text-indigo-700 font-bold group-hover:underline">Pilih &rarr;</span>
                            </div>
                          </button>

                          {/* Pilihan Alternatif Flat Penuh */}
                          <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[10.5px] text-slate-500 border-t border-slate-200">
                            <span>Atau hitung flat seluruh sesi:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTransportAmountInput(finalFlatBbm.toString())}
                                className="hover:text-emerald-700 hover:underline font-semibold text-slate-700 cursor-pointer"
                                title="Hitung flat seluruh sesi dikali tarif BBM murni tanpa memperhitungkan nota laporan"
                              >
                                BBM Murni Full ({editSesi} Sesi): Rp {finalFlatBbm.toLocaleString('id-ID')}
                              </button>
                              <span>&bull;</span>
                              <button
                                type="button"
                                onClick={() => setTransportAmountInput(finalFlatSbm.toString())}
                                className="hover:text-indigo-700 hover:underline font-semibold text-slate-700 cursor-pointer"
                                title="Hitung flat seluruh sesi dikali tarif Standar SBM tanpa memperhitungkan nota laporan"
                              >
                                Standar SBM Full ({editSesi} Sesi): Rp {finalFlatSbm.toLocaleString('id-ID')}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-[10.5px] font-bold text-slate-600 block">Pilih Opsi Pengisian Cepat:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Tombol 1: BBM MURNI (+20%) DIKALI PERTEMUAN */}
                            <button
                              type="button"
                              onClick={() => setTransportAmountInput(finalFlatBbm.toString())}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs text-left"
                              title={`Gunakan Rumus BBM Murni: Rp ${editBbmMurniPerSesi.toLocaleString('id-ID')} x ${editSesi} pertemuan = Rp ${finalFlatBbm.toLocaleString('id-ID')}`}
                            >
                              <Fuel className="w-4 h-4 shrink-0 text-emerald-200" />
                              <div className="truncate">
                                <span className="block text-[10px] text-emerald-100 font-normal">Gunakan BBM Murni (+20%):</span>
                                <span className="text-sm font-black">Rp {finalFlatBbm.toLocaleString('id-ID')}</span>
                                <span className="text-[10px] text-emerald-200 font-normal"> ({editSesi} Pertemuan)</span>
                              </div>
                            </button>

                            {/* Tombol 2: STANDAR SBM */}
                            <button
                              type="button"
                              onClick={() => setTransportAmountInput(finalFlatSbm.toString())}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs text-left"
                              title="Gunakan Standar SBM Lokal"
                            >
                              <Sparkles className="w-4 h-4 shrink-0 text-indigo-200" />
                              <div className="truncate">
                                <span className="block text-[10px] text-indigo-100 font-normal">Standar SBM:</span>
                                <span className="text-sm font-bold">Rp {finalFlatSbm.toLocaleString('id-ID')}</span>
                                <span className="text-[10px] text-indigo-200 font-normal"> ({editSesi} Pertemuan)</span>
                              </div>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Opsi Daring */}
              <div className={`p-3 rounded-xl border transition-all ${transportAmountInput === '0' ? 'bg-amber-100/90 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={transportAmountInput === '0'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTransportAmountInput('0');
                      } else {
                        const sbm = Number(editingTransportRekap.fasilitator?.besaranTransport) || 120000;
                        const sesi = Number(editingTransportRekap.jumlahSesi) || 4;
                        setTransportAmountInput((sbm * sesi).toString());
                      }
                    }}
                    className="w-4 h-4 mt-0.5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Pelaksanaan Daring (Online) — Tanpa Bantuan Transport (Rp 0)
                      </span>
                      {transportAmountInput === '0' && (
                        <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded">
                          Aktif (Rp 0)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Centang jika kegiatan berlangsung secara daring/online. Kwitansi transport tidak akan digenerate dan bantuan transport di-set Rp 0.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Total Transport Disepakati (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rp</span>
                  <input 
                    type="number"
                    min="0"
                    value={transportAmountInput}
                    onChange={e => setTransportAmountInput(e.target.value)}
                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    placeholder="Masukkan nominal transport..."
                    required
                  />
                </div>
                {transportAmountInput === '0' ? (
                  <p className="text-[11px] text-amber-700 font-semibold mt-1">
                    ⚠️ Pelaksanaan Daring: Total bantuan transport Rp 0. Kwitansi transport dinonaktifkan.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nominal ini langsung tercatat sebagai total bantuan transport fasilitator pada invoice, kwitansi, dan rekap transfer.
                  </p>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-5 py-3.5 border-t flex justify-between items-center gap-2 bg-slate-50 shrink-0">
              {editingTransportRekap.totalTransport !== null && editingTransportRekap.totalTransport !== undefined ? (
                <button
                  type="button"
                  onClick={handleResetTransportToSystem}
                  disabled={isSavingTransport}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium cursor-pointer"
                >
                  Reset ke Sistem
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTransportRekap(null)}
                  disabled={isSavingTransport}
                  className="px-4 py-2 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-medium cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveTransport}
                  disabled={isSavingTransport}
                  className="px-4 py-2 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSavingTransport ? 'Menyimpan...' : 'Simpan Transport'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Salin Semua dari Bulan Sebelumnya */}
      {showBulkCopyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b bg-indigo-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Salin Rekapitulasi dari Bulan Sebelumnya</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Duplikasi data seluruh fasilitator sekaligus dengan penyesuaian jumlah pertemuan baru secara proporsional.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowBulkCopyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border rounded-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bulan Sumber (Asal)</label>
                  <select 
                    value={bulkSourceBulan} 
                    onChange={e => setBulkSourceBulan(e.target.value)}
                    className="w-full text-xs border rounded p-2 bg-white font-medium"
                  >
                    {availableSourceMonths.map(m => (
                      <option key={m} value={m}>
                        {formatBulanIndo(m)} ({m})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bulan Target (Tujuan)</label>
                  <input 
                    type="month" 
                    value={bulkTargetBulan} 
                    onChange={e => setBulkTargetBulan(e.target.value)}
                    className="w-full text-xs border rounded p-2 bg-white font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Pertemuan Baru</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={bulkNewSesi} 
                    onChange={e => setBulkNewSesi(parseInt(e.target.value) || 4)}
                    className="w-full text-xs border rounded p-2 bg-white font-bold text-indigo-700" 
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Contoh: 3 pertemuan (Sep) &rarr; 4 pertemuan (Okt)
                  </span>
                </div>
              </div>

              {/* Tabel Pratinjau Duplikasi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Pratinjau Data yang Akan Dibuat ({bulkPreviewList.filter(it => !it.alreadyExists).length} Fasilitator Siap Dibuat)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    JP dihitung proporsional: <em>(JP Lama / Sesi Lama) &times; {bulkNewSesi} Sesi</em>
                  </span>
                </div>

                <div className="border rounded-lg overflow-x-auto max-h-[340px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase sticky top-0 border-b text-[10px]">
                      <tr>
                        <th className="p-2">No</th>
                        <th className="p-2">Fasilitator</th>
                        <th className="p-2 text-center bg-slate-200/50">Sesi Lama</th>
                        <th className="p-2 text-center bg-slate-200/50">JP Lama</th>
                        <th className="p-2 text-center bg-indigo-100 text-indigo-900 font-bold">Sesi Baru</th>
                        <th className="p-2 text-center bg-indigo-100 text-indigo-900 font-bold">JP Baru</th>
                        <th className="p-2 text-right bg-indigo-100 text-indigo-900 font-bold">Estimasi Honor Baru</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {bulkPreviewList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400">
                            Tidak ada data fasilitator pada bulan sumber.
                          </td>
                        </tr>
                      ) : (
                        bulkPreviewList.map((item, idx) => (
                          <tr key={item.fasilitatorId} className={item.alreadyExists ? 'bg-slate-50/80 opacity-60' : 'hover:bg-slate-50'}>
                            <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                            <td className="p-2 font-medium text-slate-900">
                              <div>{item.namaLengkap}</div>
                              <div className="text-[10px] text-slate-400">{item.lokasiSNT}</div>
                            </td>
                            <td className="p-2 text-center bg-slate-50 font-mono">{item.oldSesi}</td>
                            <td className="p-2 text-center bg-slate-50 font-mono">
                              {item.oldJP} JP
                              <span className="block text-[9px] text-slate-400">({item.oldIntra} I / {item.oldEkstra} E)</span>
                            </td>
                            <td className="p-2 text-center font-bold text-indigo-700 font-mono bg-indigo-50/40">
                              {item.newSesi}
                            </td>
                            <td className="p-2 text-center font-bold text-indigo-900 font-mono bg-indigo-50/40">
                              {item.newTotalJP} JP
                              <span className="block text-[9px] text-indigo-600">({item.newIntra} I / {item.newEkstra} E)</span>
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900 font-mono bg-indigo-50/40">
                              {formatCurrency(item.newHonor)}
                            </td>
                            <td className="p-2 text-center">
                              {item.alreadyExists ? (
                                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-semibold">
                                  Sudah Ada
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Siap Buat
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Total siap dibuat: <strong>{bulkPreviewList.filter(it => !it.alreadyExists).length}</strong> fasilitator untuk periode <strong>{formatBulanIndo(bulkTargetBulan)}</strong>.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkCopyModal(false)}
                  disabled={isBulkCopying}
                  className="px-4 py-2 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkCopy}
                  disabled={isBulkCopying || bulkPreviewList.filter(it => !it.alreadyExists).length === 0}
                  className="px-4 py-2 text-xs text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isBulkCopying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses Duplikasi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Buat {bulkPreviewList.filter(it => !it.alreadyExists).length} Rekap Sekaligus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atur Transportasi Massal (Rumus BBM & Batas Maksimal) */}
      {showBatchTransportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b bg-purple-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-700 text-white rounded-lg">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Atur Bantuan Transportasi Massal</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kalkulasi dan terapkan besaran bantuan transport berdasarkan <strong>Rumus Jarak BBM</strong> dan <strong>Batas Maksimal (Plafon)</strong> ke seluruh fasilitator.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowBatchTransportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Opsi Pengaturan Rumus & Plafon */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 border rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Periode Bulan Rekap</label>
                  <select 
                    value={batchTransportBulan} 
                    onChange={e => setBatchTransportBulan(e.target.value)}
                    className="w-full text-xs border rounded p-2 bg-white font-bold text-purple-900"
                  >
                    {availableRekapMonths.map(m => (
                      <option key={m} value={m}>
                        {formatBulanIndo(m)} ({m})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {batchPreviewList.length} rekapitulasi tercatat pada bulan ini
                  </span>
                </div>

                <div className="space-y-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={batchUseBbm} 
                        onChange={e => setBatchUseBbm(e.target.checked)} 
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                      />
                      <span>Gunakan Rumus BBM</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">+20% Buffer</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Harga BBM: Rp</span>
                    <input 
                      type="number" 
                      value={batchHargaBbm} 
                      onChange={e => setBatchHargaBbm(e.target.value)} 
                      disabled={!batchUseBbm}
                      className="w-full text-xs font-semibold border rounded px-2 py-1 bg-white disabled:bg-slate-100" 
                      placeholder={(globalHargaBbm || 16300).toString()}
                    />
                  </div>

                  {batchUseBbm && (
                    <div className="pt-1.5 border-t space-y-1">
                      <span className="text-[10px] font-bold text-slate-700 block">Pilihan Rumus:</span>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="batchModeBbm"
                          checked={batchModeBbm === 'MURNI'} 
                          onChange={() => setBatchModeBbm('MURNI')} 
                          className="text-purple-600" 
                        />
                        <span className="font-bold text-emerald-800">⚡ BBM Murni (+20%)</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="batchModeBbm"
                          checked={batchModeBbm === 'COMBINED'} 
                          onChange={() => setBatchModeBbm('COMBINED')} 
                          className="text-purple-600" 
                        />
                        <span>BBM (+20%) + Min SBM (Rp 120rb)</span>
                      </label>

                      <div className="pt-1.5 border-t">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-800 font-semibold cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={batchHormatiLaporan} 
                            onChange={e => setBatchHormatiLaporan(e.target.checked)} 
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                          />
                          <span>Pertahankan Sesi Terlapor</span>
                        </label>
                        <span className="text-[9.5px] text-slate-500 block leading-tight mt-0.5">
                          {batchHormatiLaporan 
                            ? 'Sesi yang sudah ada laporan dihitung sesuai laporan, sisa sesi belum lapor dihitung rumus.' 
                            : 'Seluruh sesi dihitung ulang dengan rumus tanpa melihat laporan mingguan.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={batchUseMax} 
                        onChange={e => setBatchUseMax(e.target.checked)} 
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                      />
                      <span>Batas Maksimal (Plafon)</span>
                    </label>
                    {batchUseMax && (
                      <select 
                        value={batchMaxType} 
                        onChange={e => setBatchMaxType(e.target.value as any)} 
                        className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 bg-white font-medium"
                      >
                        <option value="PER_SESI">Per Sesi</option>
                        <option value="TOTAL">Total Bulan</option>
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Nominal: Rp</span>
                    <input 
                      type="number" 
                      value={batchMaxNominal} 
                      onChange={e => setBatchMaxNominal(e.target.value)} 
                      disabled={!batchUseMax}
                      className="w-full text-xs font-bold border rounded px-2 py-1 bg-white text-purple-900 disabled:bg-slate-100" 
                      placeholder="150000"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {batchUseMax ? `Biaya transport yang melebihi Rp ${Number(batchMaxNominal || 0).toLocaleString('id-ID')} akan dipotong batas atas.` : 'Batas maksimal nonaktif (mengikuti kalkulasi penuh).'}
                  </span>
                </div>
              </div>

              {/* Tabel Pratinjau Kalkulasi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Pratinjau Hasil Perhitungan ({batchPreviewList.length} Fasilitator)
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">
                      Terkena Plafon: <strong className="text-amber-700">{batchPreviewList.filter(it => it.isCapped).length}</strong> fasilitator
                    </span>
                  </div>
                </div>

                <div className="border rounded-lg overflow-x-auto max-h-[340px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase sticky top-0 border-b text-[10px]">
                      <tr>
                        <th className="p-2 w-8">No</th>
                        <th className="p-2">Fasilitator &amp; Lokasi</th>
                        <th className="p-2 text-center">Jarak PP</th>
                        <th className="p-2 text-center">Sesi</th>
                        <th className="p-2 text-right">Transport Saat Ini</th>
                        <th className="p-2 text-right bg-purple-50 text-purple-950 font-bold">Tarif / Sesi</th>
                        <th className="p-2 text-center">Status Plafon</th>
                        <th className="p-2 text-right bg-purple-100 text-purple-950 font-bold">Transport Baru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {batchPreviewList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400">
                            Tidak ada data rekapitulasi pada bulan {batchTransportBulan}.
                          </td>
                        </tr>
                      ) : (
                        batchPreviewList.map((item, idx) => (
                          <tr key={item.rekapId} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                            <td className="p-2 font-medium text-slate-900">
                              <div>{item.nama}</div>
                              <div className="text-[10px] text-slate-500 font-normal">{item.lokasi}</div>
                            </td>
                            <td className="p-2 text-center font-mono">
                              {item.jarak > 0 ? (
                                <span className="font-semibold text-slate-700">{item.jarak} km</span>
                              ) : (
                                <span className="text-slate-400">Lokal</span>
                              )}
                            </td>
                            <td className="p-2 text-center font-bold text-slate-700">{item.sesi}</td>
                            <td className="p-2 text-right font-mono text-slate-600">
                              Rp {item.currentTransport.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2 text-right font-bold text-purple-900 bg-purple-50/50 font-mono">
                              Rp {item.newPerSesi.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2 text-center">
                              {item.isCapped ? (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                  ⚠️ Dibatasi Plafon
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.5 rounded-full">
                                  ✓ Sesuai Rumus
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-right font-bold text-purple-900 bg-purple-100/50 font-mono text-sm">
                              Rp {item.newTotal.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {batchPreviewList.length > 0 && (
                      <tfoot className="bg-slate-100 font-bold sticky bottom-0 border-t text-xs">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right uppercase text-slate-700">Total Keseluruhan:</td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            Rp {batchPreviewList.reduce((s, it) => s + it.currentTransport, 0).toLocaleString('id-ID')}
                          </td>
                          <td colSpan={2} className="p-2.5 text-center text-[11px] text-slate-500 font-normal">
                            Selisih: {(() => {
                              const sel = batchPreviewList.reduce((s, it) => s + it.newTotal, 0) - batchPreviewList.reduce((s, it) => s + it.currentTransport, 0);
                              return sel >= 0 ? `+Rp ${sel.toLocaleString('id-ID')}` : `-Rp ${Math.abs(sel).toLocaleString('id-ID')}`;
                            })()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-purple-950 font-mono text-sm bg-purple-100">
                            Rp {batchPreviewList.reduce((s, it) => s + it.newTotal, 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Akan memperbarui biaya transport untuk <strong>{batchPreviewList.length}</strong> fasilitator di bulan <strong>{formatBulanIndo(batchTransportBulan)}</strong>.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchTransportModal(false)}
                  disabled={isApplyingBatchTransport}
                  className="px-4 py-2 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyBatchTransport}
                  disabled={isApplyingBatchTransport || batchPreviewList.length === 0}
                  className="px-4 py-2 text-xs text-white bg-purple-700 hover:bg-purple-800 rounded-lg font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isApplyingBatchTransport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menerapkan Transport...</span>
                    </>
                  ) : (
                    <>
                      <Fuel className="w-3.5 h-3.5" />
                      <span>Terapkan ke {batchPreviewList.length} Fasilitator</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Export PDF Rincian & Kebutuhan Bulanan */}
      {showExportMonthlyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Sticky */}
            <div className="flex justify-between items-center px-5 py-4 border-b bg-emerald-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-2xs">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-emerald-950">
                    Export PDF Rincian &amp; Kebutuhan Bulanan
                  </h3>
                  <p className="text-xs text-emerald-800/80 mt-0.5">
                    Unduh laporan PDF rekapitulasi kebutuhan dana honorarium dan transport per bulan
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowExportMonthlyModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg text-lg font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="px-5 py-4 overflow-y-auto space-y-4 flex-1">
              
              {/* 1. Pilihan Periode Bulan */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  1. Pilih Periode Bulan Rekapitulasi:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={exportSelectedBulan}
                    onChange={(e) => setExportSelectedBulan(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    {availableRekapMonths.map(m => {
                      const count = initialData.filter((r: any) => r.bulan === m).length;
                      return (
                        <option key={m} value={m}>
                          Bulan {formatBulanIndo(m)} ({count} Fasilitator)
                        </option>
                      );
                    })}
                  </select>

                  <input
                    type="month"
                    value={exportSelectedBulan}
                    onChange={(e) => setExportSelectedBulan(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Pilih bulan yang ingin diekspor dari daftar rekap aktif atau tentukan periode bulan secara manual.
                </span>
              </div>

              {/* 2. Live Preview Ringkasan Kebutuhan */}
              {exportPreviewData && exportPreviewData.totalFasilitator > 0 ? (
                <div className="bg-linear-to-br from-emerald-50/80 via-teal-50/40 to-slate-50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      Ringkasan Kebutuhan Dana Bulan {formatBulanIndo(exportSelectedBulan)}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
                      {exportPreviewData.totalFasilitator} Fasilitator Terdata
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total JP Mengajar</span>
                      <span className="text-sm font-bold text-slate-800">{exportPreviewData.totalJP} JP</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-blue-700 block font-semibold uppercase">Kebutuhan Honor</span>
                      <span className="text-sm font-bold text-blue-900">{formatCurrency(exportPreviewData.totalHonor)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-amber-700 block font-semibold uppercase">Bantuan Transport</span>
                      <span className="text-sm font-bold text-amber-900">{formatCurrency(exportPreviewData.totalTransport)}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-600 text-white p-3 rounded-lg flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10.5px] uppercase tracking-wider text-emerald-100 font-bold block">
                        Estimasi Total Kebutuhan Dana:
                      </span>
                      <span className="text-base sm:text-lg font-black font-mono">
                        {formatCurrency(exportPreviewData.grandTotal)}
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-emerald-100">
                      <span className="block font-semibold">{exportPreviewData.lunasCount} Lunas</span>
                      <span className="block opacity-90">{exportPreviewData.unpaidCount} Menunggu Bayar</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/90 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="leading-relaxed">
                      <strong>Termasuk Data Rekening Pembayaran:</strong> Laporan PDF otomatis menyertakan Nama Bank, Nomor Rekening, dan Nama Penerima masing-masing fasilitator untuk kebutuhan otorisasi transfer.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Belum ada data rekapitulasi honorarium untuk bulan {formatBulanIndo(exportSelectedBulan)}.</span>
                </div>
              )}

              {/* 3. Pilihan Kop Surat */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  2. Pilihan Kop Surat / Lembaga:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className={`p-2.5 border rounded-lg flex items-start gap-2 cursor-pointer transition-all ${
                    exportKopType === 'maleo' ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-950' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="exportKopType" 
                      checked={exportKopType === 'maleo'} 
                      onChange={() => setExportKopType('maleo')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <span className="block">Yayasan Maleo</span>
                      <span className="text-[10px] text-slate-500 font-normal block">Maleo Talenta Cendekia</span>
                    </div>
                  </label>

                  <label className={`p-2.5 border rounded-lg flex items-start gap-2 cursor-pointer transition-all ${
                    exportKopType === 'robotic' ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-950' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="exportKopType" 
                      checked={exportKopType === 'robotic'} 
                      onChange={() => setExportKopType('robotic')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <span className="block">PT Robotik</span>
                      <span className="text-[10px] text-slate-500 font-normal block">Jully Tjindrawan Robotik</span>
                    </div>
                  </label>

                  <label className={`p-2.5 border rounded-lg flex items-start gap-2 cursor-pointer transition-all ${
                    exportKopType === 'none' ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-950' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="exportKopType" 
                      checked={exportKopType === 'none'} 
                      onChange={() => setExportKopType('none')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <span className="block">Tanpa Gambar Kop</span>
                      <span className="text-[10px] text-slate-500 font-normal block">Header Teks Formal SNT</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Orientasi & Filter Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    3. Orientasi Kertas:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className={`p-2 border rounded-lg flex items-center gap-1.5 cursor-pointer text-center justify-center transition-all ${
                      exportOrientation === 'landscape' ? 'border-emerald-500 bg-emerald-50/60 font-bold text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="exportOrientation" 
                        checked={exportOrientation === 'landscape'} 
                        onChange={() => setExportOrientation('landscape')}
                        className="text-emerald-600"
                      />
                      <span>Landscape (Lebar)</span>
                    </label>

                    <label className={`p-2 border rounded-lg flex items-center gap-1.5 cursor-pointer text-center justify-center transition-all ${
                      exportOrientation === 'portrait' ? 'border-emerald-500 bg-emerald-50/60 font-bold text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="exportOrientation" 
                        checked={exportOrientation === 'portrait'} 
                        onChange={() => setExportOrientation('portrait')}
                        className="text-emerald-600"
                      />
                      <span>Portrait (Tegak)</span>
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    *Landscape sangat direkomendasikan agar seluruh kolom rincian dan nomor rekening tidak terhimpit.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    4. Filter Status Data:
                  </label>
                  <select
                    value={exportStatusFilter}
                    onChange={(e: any) => setExportStatusFilter(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium"
                  >
                    <option value="ALL">Semua Data Fasilitator</option>
                    <option value="UNPAID">Hanya Yang Belum Dibayar / Proses</option>
                    <option value="LUNAS">Hanya Yang Sudah Selesai Dibayar (Lunas)</option>
                  </select>

                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tanggal Dokumen:
                    </label>
                    <input 
                      type="date"
                      value={exportTanggalDokumen}
                      onChange={e => setExportTanggalDokumen(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Footer */}
            <div className="px-5 py-3.5 border-t flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 shrink-0">
              <span className="text-[11px] text-slate-500">
                Laporan siap diunduh otomatis atau dicetak langsung via dialog print browser.
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExportMonthlyModal(false)}
                  disabled={isGeneratingReportPdf}
                  className="px-3.5 py-2 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-medium cursor-pointer transition-colors"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handlePrintViaBrowser}
                  disabled={isGeneratingReportPdf || !exportPreviewData || exportPreviewData.totalFasilitator === 0}
                  className="px-3.5 py-2 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-semibold disabled:opacity-50 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
                  title="Buka dialog cetak browser untuk Simpan sebagai PDF (Vector kualitas tinggi) atau print ke printer fisik"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cetak / Simpan PDF (Browser)</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateMonthlyReportPdf}
                  disabled={isGeneratingReportPdf || !exportPreviewData || exportPreviewData.totalFasilitator === 0}
                  className="px-4 py-2 text-xs text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-semibold disabled:opacity-50 cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isGeneratingReportPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Membuat PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download PDF Rekap</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Bukti Transfer / PDF */}
      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
        title={previewModal.title}
        url={previewModal.url}
      />

      {/* Modal Kirim / Konfirmasi WhatsApp Fasilitator */}
      <RekapWhatsAppModal
        isOpen={waModalState.isOpen}
        rekap={waModalState.rekap}
        postUploadInfo={waModalState.postUploadInfo}
        onClose={() => setWaModalState({ isOpen: false, rekap: null, postUploadInfo: null })}
        onKontakSaved={() => router.refresh()}
      />

    </div>
  )
}
