"use client";

import { useMemo, useState } from "react";
import { X, CheckCircle2, Loader2, Landmark, FileUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { uploadFileClient } from "@/lib/upload-client";
import { markCashflowTransactionPaid } from "@/actions/cashflow";

export interface CashflowCoaOption {
  id: string;
  code: string;
  name: string;
  type: string;
}

export interface CashflowTxRecord {
  id: string;
  date: string | Date;
  type: "INCOME" | "EXPENSE" | string;
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  status: string;
  receiptUrl?: string | null;
  vendorName?: string | null;
  invoiceNumber?: string | null;
  currency?: string | null;
  originalAmount?: number | null;
  exchangeRate?: number | null;
  accountId?: string | null;
  taxWithheldAmount?: number | null;
  iyrcBudgetPos?: string | null;
  iyrcProgram?: string | null;
  account?: { id: string; code: string; name: string; type: string } | null;
  journalEntry?: { id: string; entryNumber: string; status: string } | null;
}

interface MarkPaidModalProps {
  transaction: CashflowTxRecord | null;
  accounts?: CashflowCoaOption[];
  onClose: () => void;
  onSuccess: (updatedTx: CashflowTxRecord) => void;
}

function MarkPaidModalInner({
  transaction,
  accounts = [],
  onClose,
  onSuccess,
}: {
  transaction: CashflowTxRecord;
  accounts?: CashflowCoaOption[];
  onClose: () => void;
  onSuccess: (updatedTx: CashflowTxRecord) => void;
}) {
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState(
    () => transaction.paymentMethod || "TRANSFER"
  );
  const [actualAmount, setActualAmount] = useState(() => String(transaction.amount || 0));
  const [taxWithheldAmount, setTaxWithheldAmount] = useState(() =>
    String(transaction.taxWithheldAmount || 0)
  );
  const [accountId, setAccountId] = useState(() => transaction.accountId || "");
  const [receiptUrl, setReceiptUrl] = useState(() => transaction.receiptUrl || "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredAccounts = useMemo(() => {
    const wantedType = transaction.type === "INCOME" ? "REVENUE" : "EXPENSE";
    const matching = accounts.filter((a) => a.type === wantedType);
    return matching.length > 0 ? matching : accounts;
  }, [accounts, transaction.type]);

  const expectedAmount = Number(transaction.amount) || 0;
  const parsedActual = parseFloat(actualAmount) || 0;
  const parsedTax = Math.max(0, parseFloat(taxWithheldAmount) || 0);
  const diffFromTagihan = expectedAmount - parsedActual;

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadFileClient(e.target.files[0], "cashflow-invoices");
      setReceiptUrl(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError("Gagal upload bukti: " + msg);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedActual <= 0) {
      setError("Nominal aktual harus lebih dari Rp 0.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await markCashflowTransactionPaid(transaction.id, {
        paidDate,
        paymentMethod,
        actualAmount: parsedActual,
        taxWithheldAmount: transaction.type === "INCOME" ? parsedTax : 0,
        accountId: accountId || undefined,
        paidReceiptUrl: receiptUrl || undefined,
      });

      if (!res.success || !res.transaction) {
        setError(res.error || "Gagal menyimpan pelunasan");
        return;
      }

      onSuccess(res.transaction);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui status";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const cashAccountLabel =
    paymentMethod.toUpperCase() === "CASH"
      ? "111.10.101 • Kas"
      : "111.11.101 • BCA";

  const selectedCoa = filteredAccounts.find((a) => a.id === accountId);
  const selectedCoaLabel = selectedCoa
    ? `${selectedCoa.code} • ${selectedCoa.name}`
    : transaction.account
    ? `${transaction.account.code} • ${transaction.account.name}`
    : "Otomatis sesuai kategori";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <CheckCircle2 size={18} />
              Konfirmasi Pelunasan &amp; Posting Jurnal Utama
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5 line-clamp-1">
              {transaction.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Nilai Tagihan / Rencana Awal</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {formatCurrency(expectedAmount)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tanggal Cair / Transfer
              </label>
              <input
                type="date"
                required
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Rekening / Metode Bayar
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-white"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="TRANSFER">Transfer Bank BCA (111.11.101)</option>
                <option value="BANK">Bank / Wire Transfer (111.11.101)</option>
                <option value="CASH">Kas Tunai (111.10.101)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              {transaction.type === "INCOME"
                ? "Nominal Aktual Masuk ke Bank/Kas (Rp)"
                : "Nominal Aktual Dibayar (Rp)"}
            </label>
            <input
              type="number"
              required
              min="1"
              step="1"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-mono font-bold text-slate-900"
              value={actualAmount}
              onChange={(e) => {
                const val = e.target.value;
                setActualAmount(val);
                if (transaction.type === "INCOME") {
                  const num = parseFloat(val) || 0;
                  const diff = expectedAmount - num;
                  setTaxWithheldAmount(diff > 0 ? String(Math.round(diff)) : "0");
                }
              }}
            />
            {transaction.type === "INCOME" && diffFromTagihan > 0 && (
              <p className="text-[11px] text-amber-700 mt-1 font-medium">
                Selisih {formatCurrency(diffFromTagihan)} dari tagihan awal (mis. potongan PPh/PPN bendahara).
              </p>
            )}
          </div>

          {transaction.type === "INCOME" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Potongan Pajak Bendahara PPh / PPN (Opsional → 600.10.037)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-mono"
                value={taxWithheldAmount}
                onChange={(e) => setTaxWithheldAmount(e.target.value)}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Isi `0` jika pendapatan direvisi menjadi nominal bersih tanpa mencatat potongan pajak di jurnal.
              </p>
            </div>
          )}

          {filteredAccounts.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Akun COA Akuntansi Utama
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-white"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="">Otomatis (sesuai mapping kategori)</option>
                {filteredAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Bukti Transfer / Nota (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">
                <FileUp size={14} />
                {uploading ? "Mengunggah..." : "Pilih File Bukti"}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  disabled={uploading || submitting}
                  onChange={handleUploadReceipt}
                />
              </label>
              {receiptUrl && (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:underline truncate max-w-[200px]"
                >
                  Bukti terlampir
                </a>
              )}
            </div>
          </div>

          {/* Preview Jurnal Umum */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-1.5">
            <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
              <Landmark size={13} /> Preview Jurnal Umum Otomatis (POSTED)
            </div>
            <div className="text-xs text-slate-700 space-y-1 font-mono">
              {transaction.type === "INCOME" ? (
                <>
                  <div className="flex justify-between">
                    <span>[D] {cashAccountLabel}</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(parsedActual)}</span>
                  </div>
                  {parsedTax > 0 && (
                    <div className="flex justify-between">
                      <span>[D] 600.10.037 • Penerimaan Negara</span>
                      <span className="font-bold text-amber-700">{formatCurrency(parsedTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>[K] {selectedCoaLabel}</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(parsedActual + parsedTax)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>[D] {selectedCoaLabel}</span>
                    <span className="font-bold text-rose-700">{formatCurrency(parsedActual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>[K] {cashAccountLabel}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(parsedActual)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Memposting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Konfirmasi Lunas &amp; Posting
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MarkPaidModal({
  transaction,
  accounts = [],
  onClose,
  onSuccess,
}: MarkPaidModalProps) {
  if (!transaction) return null;
  return (
    <MarkPaidModalInner
      key={transaction.id}
      transaction={transaction}
      accounts={accounts}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
