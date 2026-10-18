"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  Edit,
  Plus,
  Search,
  RotateCcw,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
} from "lucide-react";
import { useModal } from "@/components/modal-provider";

type JournalEntry = {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string | null;
  status: "DRAFT" | "POSTED" | "VOID";
  totalDebit: number;
  totalCredit: number;
};

type Account = {
  id: string;
  code: string;
  name: string;
};

type EditLine = {
  id: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
};

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function JurnalPage() {
  const { confirm, alert } = useModal();

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [editId, setEditId] = useState("");
  const [editEntryNumber, setEditEntryNumber] = useState("");
  const [editStatus, setEditStatus] = useState("DRAFT");
  const [editDate, setEditDate] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLines, setEditLines] = useState<EditLine[]>([]);

  useEffect(() => {
    fetchJournals();
  }, [statusFilter, searchTerm]);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== "ALL") query.append("status", statusFilter);
      if (searchTerm) query.append("search", searchTerm);

      const response = await fetch(`/api/journals?${query.toString()}`);
      if (!response.ok) throw new Error("Gagal mengambil data jurnal");
      const data = await response.json();
      setJournals(data.journals || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    if (accounts.length > 0) return accounts;
    try {
      const res = await fetch("/api/accounts?isActive=true");
      if (res.ok) {
        const data = await res.json();
        const accs = data.accounts || data;
        setAccounts(accs);
        return accs;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  const handleOpenEditModal = async (journalId: string) => {
    setIsEditModalOpen(true);
    setIsLoadingDetail(true);
    try {
      const [_, jRes] = await Promise.all([
        fetchAccounts(),
        fetch(`/api/journals/${journalId}`),
      ]);

      if (jRes.ok) {
        const data = await jRes.json();
        const j = data.journal;
        setEditId(j.id);
        setEditEntryNumber(j.entryNumber);
        setEditStatus(j.status);
        setEditDate(format(new Date(j.date), "yyyy-MM-dd"));
        setEditReference(j.reference || "");
        setEditDescription(j.description || "");
        setEditLines(
          j.lines.map((l: any) => ({
            id: l.id || Math.random().toString(),
            accountId: l.accountId,
            description: l.description || "",
            debit: l.debit || 0,
            credit: l.credit || 0,
          }))
        );
      } else {
        await alert("Gagal memuat detail jurnal untuk diedit");
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      await alert("Terjadi kesalahan saat memuat data jurnal");
      setIsEditModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const addEditLine = () => {
    setEditLines([
      ...editLines,
      { id: Date.now().toString(), accountId: "", description: "", debit: 0, credit: 0 },
    ]);
  };

  const removeEditLine = async (lineId: string) => {
    if (editLines.length <= 2) {
      await alert("Jurnal harus memiliki minimal 2 baris akun");
      return;
    }
    setEditLines(editLines.filter((l) => l.id !== lineId));
  };

  const updateEditLine = (
    lineId: string,
    field: "accountId" | "description" | "debit" | "credit",
    value: any
  ) => {
    setEditLines(
      editLines.map((l) => {
        if (l.id === lineId) {
          const updated = { ...l, [field]: value };
          if (field === "debit" && Number(value) > 0) updated.credit = 0;
          else if (field === "credit" && Number(value) > 0) updated.debit = 0;
          return updated;
        }
        return l;
      })
    );
  };

  const totalEditDebit = editLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalEditCredit = editLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const editSelisih = Math.abs(totalEditDebit - totalEditCredit);
  const isEditBalanced = editSelisih < 0.01 && totalEditDebit > 0;

  const handleSaveEdit = async () => {
    if (editLines.length < 2) {
      await alert("Jurnal harus memiliki minimal 2 baris akun");
      return;
    }

    const hasEmpty = editLines.some((l) => !l.accountId);
    if (hasEmpty) {
      await alert("Harap pilih akun untuk semua baris jurnal");
      return;
    }

    if (!isEditBalanced) {
      await alert("Total Debit dan Kredit harus seimbang (Selisih = 0) sebelum disimpan.");
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await fetch(`/api/journals/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editDate,
          description: editDescription,
          reference: editReference,
          lines: editLines.map(({ accountId, description, debit, credit }) => ({
            accountId,
            description,
            debit: Number(debit),
            credit: Number(credit),
          })),
        }),
      });

      if (res.ok) {
        await alert("Jurnal berhasil diperbarui!");
        setIsEditModalOpen(false);
        fetchJournals();
      } else {
        const err = await res.json();
        await alert(`Gagal memperbarui jurnal: ${err.error || err.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error(error);
      await alert("Terjadi kesalahan saat menyimpan perubahan jurnal");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePost = async (id: string) => {
    if (!(await confirm("Apakah Anda yakin ingin memposting jurnal ini?"))) return;
    try {
      const response = await fetch(`/api/journals/${id}/post`, {
        method: "POST",
      });
      if (response.ok) fetchJournals();
      else await alert("Gagal memposting jurnal");
    } catch (error) {
      console.error(error);
    }
  };

  const handleUnpost = async (id: string) => {
    if (
      !(await confirm(
        "Kembalikan jurnal ini ke status Draft? Anda dapat mengedit semua data dan mempostingnya kembali."
      ))
    )
      return;
    try {
      const response = await fetch(`/api/journals/${id}/unpost`, {
        method: "POST",
      });
      if (response.ok) {
        await alert("Jurnal berhasil dikembalikan ke status Draft.");
        fetchJournals();
      } else {
        const data = await response.json();
        await alert(data.error || "Gagal mengembalikan jurnal ke status Draft");
      }
    } catch (error) {
      console.error(error);
      await alert("Terjadi kesalahan saat mengembalikan status jurnal");
    }
  };

  const handleVoid = async (id: string) => {
    if (!(await confirm("Apakah Anda yakin ingin membatalkan (void) jurnal ini?"))) return;
    try {
      const response = await fetch(`/api/journals/${id}/void`, {
        method: "POST",
      });
      if (response.ok) fetchJournals();
      else await alert("Gagal membatalkan jurnal");
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "POSTED":
        return <Badge className="bg-green-500 hover:bg-green-600">Posted</Badge>;
      case "DRAFT":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Draft</Badge>;
      case "VOID":
        return <Badge variant="destructive">Void</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Jurnal Umum</h2>
        <div className="flex items-center space-x-2">
          <Link href="/jurnal/baru">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Jurnal Baru
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Jurnal</CardTitle>
          <CardDescription>
            Kelola dan lihat semua transaksi jurnal umum perusahaan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari no jurnal, deskripsi..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="VOID">Void</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Jurnal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : journals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Tidak ada data jurnal ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  journals.map((journal) => (
                    <TableRow key={journal.id}>
                      <TableCell className="font-medium">
                        {journal.entryNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(journal.date), "dd MMM yyyy", {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell>{journal.description}</TableCell>
                      <TableCell>{journal.reference || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(journal.totalDebit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(journal.totalCredit)}
                      </TableCell>
                      <TableCell>{getStatusBadge(journal.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          {journal.status !== "VOID" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(journal.id)}
                              title="Edit Jurnal (Popup)"
                              className="hover:border-blue-500 hover:text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Link href={`/jurnal/${journal.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Lihat Detail Halaman Penuh"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {journal.status === "DRAFT" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handlePost(journal.id)}
                              title="Posting Jurnal"
                            >
                              Post
                            </Button>
                          )}
                          {journal.status === "POSTED" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnpost(journal.id)}
                                title="Kembalikan ke Draft (Unpost)"
                                className="text-amber-600 border-amber-300 hover:bg-amber-50"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleVoid(journal.id)}
                                title="Batalkan (Void)"
                              >
                                Void
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* POPUP MODAL EDIT JURNAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl">
                Edit Jurnal: {editEntryNumber}
              </DialogTitle>
              {getStatusBadge(editStatus)}
            </div>
            <DialogDescription>
              Ubah data transaksi jurnal umum langsung tanpa perlu berpindah halaman.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-12 text-center text-muted-foreground">
              Memuat data jurnal...
            </div>
          ) : (
            <div className="space-y-4">
              {editStatus === "POSTED" && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-xs sm:text-sm">
                  ⚠️ <strong>Catatan:</strong> Jurnal ini berstatus <strong>POSTED</strong>. Perubahan akan langsung mengupdate saldo akun terkait. Pastikan total <strong>Debit dan Kredit tetap seimbang</strong>.
                </div>
              )}

              {/* Form Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Tanggal Transaksi</Label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Referensi (Opsional)</Label>
                  <Input
                    placeholder="Contoh: INV-001, BKK-01"
                    value={editReference}
                    onChange={(e) => setEditReference(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold">Keterangan Jurnal</Label>
                  <Textarea
                    rows={2}
                    placeholder="Deskripsi transaksi..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Baris Akun Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Baris Akun (Debit & Kredit)</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEditLine}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Baris
                  </Button>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[32%]">Akun</TableHead>
                        <TableHead className="w-[28%]">Keterangan Baris</TableHead>
                        <TableHead className="w-[18%] text-right">Debit (Rp)</TableHead>
                        <TableHead className="w-[18%] text-right">Kredit (Rp)</TableHead>
                        <TableHead className="w-[4%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="p-2">
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={line.accountId}
                              onChange={(e) => updateEditLine(line.id, "accountId", e.target.value)}
                            >
                              <option value="">-- Pilih Akun --</option>
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              value={line.description}
                              onChange={(e) => updateEditLine(line.id, "description", e.target.value)}
                              placeholder="Keterangan..."
                              className="h-9 text-xs sm:text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              value={line.debit || ""}
                              onChange={(e) =>
                                updateEditLine(
                                  line.id,
                                  "debit",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="h-9 text-right text-xs sm:text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              value={line.credit || ""}
                              onChange={(e) =>
                                updateEditLine(
                                  line.id,
                                  "credit",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="h-9 text-right text-xs sm:text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => removeEditLine(line.id)}
                              disabled={editLines.length <= 2}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex flex-wrap items-center justify-between bg-muted/40 p-3 rounded-lg border text-sm gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-muted-foreground text-xs block">Total Debit</span>
                    <span className="font-bold">{formatRupiah(totalEditDebit)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Total Kredit</span>
                    <span className="font-bold">{formatRupiah(totalEditCredit)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Selisih</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        editSelisih > 0 ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {formatRupiah(editSelisih)}
                      {isEditBalanced ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingEdit}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !isEditBalanced}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
