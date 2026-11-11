"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  MessageSquare,
  Send,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Phone,
  Save,
  Loader2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  buildRekapWhatsAppMessage,
  copyImageFileToClipboard,
  getWhatsAppWebUrl,
  launchWhatsAppDesktop,
  normalizeWhatsAppNumber,
} from "@/lib/rekap-whatsapp";
import { updateFasilitatorKontak } from "@/app/actions/rekap";

export interface RekapWhatsAppModalProps {
  isOpen: boolean;
  rekap: any | null;
  postUploadInfo?: {
    launchedDesktop: boolean;
    imageCopied: boolean;
    imageFiles?: File[];
    urlHonor?: string | null;
    urlTransport?: string | null;
  } | null;
  onClose: () => void;
  onKontakSaved?: () => void;
}

export function RekapWhatsAppModal({
  isOpen,
  rekap,
  postUploadInfo,
  onClose,
  onKontakSaved,
}: RekapWhatsAppModalProps) {
  const [phoneInput, setPhoneInput] = useState("");
  const [waMessage, setWaMessage] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImgIdx, setCopiedImgIdx] = useState<number | null>(null);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSavedMsg, setPhoneSavedMsg] = useState("");

  const buildDefaultMsg = (r: any) =>
    buildRekapWhatsAppMessage(r, {
      urlHonor: postUploadInfo?.urlHonor ?? r?.shortUrlHonor ?? r?.buktiPembayaranHonor,
      urlTransport:
        postUploadInfo?.urlTransport ?? r?.shortUrlTransport ?? r?.buktiPembayaranTransport,
    });

  useEffect(() => {
    if (!isOpen || !rekap) return;
    setPhoneInput(rekap.fasilitator?.kontak || "");
    setWaMessage(buildDefaultMsg(rekap));
    setCopiedText(false);
    setCopiedImgIdx(null);
    setPhoneSavedMsg("");
  }, [isOpen, rekap, postUploadInfo]);

  const normalizedPhone = useMemo(() => normalizeWhatsAppNumber(phoneInput), [phoneInput]);

  if (!isOpen || !rekap) return null;

  const isPhoneDirty =
    (phoneInput || "").trim() !== (rekap.fasilitator?.kontak || "").trim();

  const handleSavePhone = async (): Promise<boolean> => {
    if (!rekap.fasilitatorId) return false;
    setIsSavingPhone(true);
    setPhoneSavedMsg("");
    try {
      const res = await updateFasilitatorKontak(rekap.fasilitatorId, phoneInput);
      if (res?.error) {
        alert("Gagal menyimpan nomor WA: " + res.error);
        return false;
      }
      setPhoneSavedMsg("Nomor WA tersimpan ke profil fasilitator.");
      onKontakSaved?.();
      return true;
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleLaunchDesktop = async () => {
    if (!normalizedPhone) {
      alert("Masukkan nomor WhatsApp fasilitator yang valid terlebih dahulu (contoh: 08123456789).");
      return;
    }
    if (isPhoneDirty) {
      await handleSavePhone();
    }
    launchWhatsAppDesktop(normalizedPhone, waMessage);
  };

  const handleOpenWeb = async () => {
    if (!normalizedPhone) {
      alert("Masukkan nomor WhatsApp fasilitator yang valid terlebih dahulu.");
      return;
    }
    if (isPhoneDirty) {
      await handleSavePhone();
    }
    window.open(getWhatsAppWebUrl(normalizedPhone, waMessage), "_blank", "noopener,noreferrer");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      alert("Gagal menyalin teks ke clipboard.");
    }
  };

  const handleCopyImage = async (file: File, idx: number) => {
    const ok = await copyImageFileToClipboard(file);
    if (ok) {
      setCopiedImgIdx(idx);
      setTimeout(() => setCopiedImgIdx(null), 2500);
    } else {
      alert("Browser membatasi salin gambar otomatis. Anda dapat menggunakan link bukti transfer pada teks atau drag file ke WhatsApp.");
    }
  };

  const imageFiles = (postUploadInfo?.imageFiles || []).filter((f) =>
    f.type.startsWith("image/")
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden border border-slate-200">
        {/* Sticky Header */}
        <div className="px-5 py-3.5 border-b bg-emerald-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {postUploadInfo
                  ? "Bukti Terupload — Siap Kirim WhatsApp ke Fasilitator"
                  : "Kirim Rincian Pembayaran via WhatsApp"}
              </h3>
              <p className="text-xs text-slate-600">
                {rekap.fasilitator?.namaLengkap} &bull; Bulan {rekap.bulan}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {postUploadInfo && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Bukti pembayaran berhasil diupload &amp; RAB berhasil dipotong!
              </div>
              {postUploadInfo.launchedDesktop ? (
                <p className="text-emerald-800">
                  Aplikasi <strong>WhatsApp Desktop</strong> telah dipicu ke chat fasilitator dengan pesan rincian terisi otomatis (tinggal tekan <strong>Enter</strong>).
                  {postUploadInfo.imageCopied && (
                    <span className="block mt-1 font-semibold text-emerald-900">
                      ✓ Gambar bukti transfer juga telah disalin ke clipboard — cukup tekan <kbd className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-[10px]">Ctrl+V</kbd> di kolom chat WA untuk melampirkan gambarnya!
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-amber-800">
                  Nomor WhatsApp fasilitator belum valid/kosong sehingga aplikasi WhatsApp belum dibuka otomatis. Silakan isi nomor WA di bawah lalu klik tombol kirim.
                </p>
              )}
            </div>
          )}

          {/* Input Nomor WA Fasilitator */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-600" />
                Nomor WhatsApp Fasilitator
              </label>
              {normalizedPhone ? (
                <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Format WA: +{normalizedPhone}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                  <AlertCircle size={11} /> Nomor WA belum valid
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  setPhoneSavedMsg("");
                }}
                placeholder="Contoh: 081234567890 atau 6281234567890"
                className="flex-1 text-sm font-mono font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {isPhoneDirty && (
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={isSavingPhone}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer disabled:opacity-50"
                >
                  {isSavingPhone ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  Simpan Nomor
                </button>
              )}
            </div>
            {phoneSavedMsg && (
              <p className="text-[11px] text-emerald-700 font-medium">{phoneSavedMsg}</p>
            )}
          </div>

          {/* Salin Gambar Bukti (jika ada file gambar yang baru diupload) */}
          {imageFiles.length > 0 && (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-indigo-950">
                <strong className="block">Lampirkan Gambar Bukti via Paste (Ctrl+V):</strong>
                <span className="text-[11px] text-indigo-700">
                  Klik tombol di samping lalu tekan Ctrl+V di dalam chat WhatsApp Desktop.
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {imageFiles.map((f, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCopyImage(f, idx)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-indigo-300 text-indigo-800 hover:bg-indigo-100 cursor-pointer"
                  >
                    {copiedImgIdx === idx ? <Check size={13} className="text-emerald-600" /> : <ImageIcon size={13} />}
                    {copiedImgIdx === idx
                      ? "Gambar Disalin! Tekan Ctrl+V"
                      : `Salin Gambar (${f.name.slice(0, 18)}${f.name.length > 18 ? "..." : ""})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editor / Preview Pesan WhatsApp */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Teks Rincian Pesan WhatsApp (Dapat Diedit):
              </label>
              <button
                type="button"
                onClick={() => setWaMessage(buildDefaultMsg(rekap))}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 cursor-pointer"
              >
                <RotateCcw size={11} /> Reset Template
              </button>
            </div>
            <textarea
              rows={11}
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/40"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-5 py-3.5 border-t bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {copiedText ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copiedText ? "Teks Disalin" : "Salin Teks"}
            </button>

            <button
              type="button"
              onClick={handleOpenWeb}
              disabled={!normalizedPhone}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
            >
              <ExternalLink size={13} />
              WhatsApp Web
            </button>

            <button
              type="button"
              onClick={handleLaunchDesktop}
              disabled={!normalizedPhone}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send size={13} />
              {postUploadInfo ? "Buka Ulang WhatsApp Desktop" : "Buka & Kirim WhatsApp Desktop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
