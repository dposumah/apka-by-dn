"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

type Account = {
  id: string;
  code: string;
  name: string;
};

type JournalLine = {
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

export default function JurnalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("DRAFT");
  const [entryNumber, setEntryNumber] = useState("");
  
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsRes, journalRes] = await Promise.all([
        fetch("/api/accounts?isActive=true"),
        fetch(`/api/journals/${params.id}`),
      ]);

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || data);
      }

      if (journalRes.ok) {
        const data = await journalRes.json();
        const j = data.journal;
        setStatus(j.status);
        setEntryNumber(j.entryNumber);
        setDate(format(new Date(j.date), "yyyy-MM-dd"));
        setDescription(j.description);
        setReference(j.reference || "");
        setLines(
          j.lines.map((line: any) => ({
            id: line.id,
            accountId: line.accountId,
            description: line.description || "",
            debit: line.debit,
            credit: line.credit,
          }))
        );
      } else {
        alert("Jurnal tidak ditemukan");
        router.push("/jurnal");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isEditable = status === "DRAFT";

  const addLine = () => {
    if (!isEditable) return;
    setLines([
      ...lines,
      { id: Date.now().toString(), accountId: "", description: "", debit: 0, credit: 0 },
    ]);
  };

  const removeLine = (id: string) => {
    if (!isEditable) return;
    if (lines.length <= 2) {
      alert("Jurnal harus memiliki minimal 2 baris");
      return;
    }
    setLines(lines.filter((line) => line.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    if (!isEditable) return;
    setLines(
      lines.map((line) => {
        if (line.id === id) {
          const newLine = { ...line, [field]: value };
          if (field === "debit" && value > 0) {
            newLine.credit = 0;
          } else if (field === "credit" && value > 0) {
            newLine.debit = 0;
          }
          return newLine;
        }
        return line;
      })
    );
  };

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const selisih = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleUpdate = async () => {
    if (lines.length < 2) {
      alert("Jurnal harus memiliki minimal 2 baris");
      return;
    }

    const hasEmptyAccounts = lines.some((line) => !line.accountId);
    if (hasEmptyAccounts) {
      alert("Silakan pilih akun untuk semua baris");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/journals/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description,
          reference,
          lines: lines.map(({ accountId, description, debit, credit }) => ({
            accountId,
            description,
            debit: Number(debit),
            credit: Number(credit),
          })),
        }),
      });

      if (res.ok) {
        alert("Jurnal berhasil diperbarui");
        fetchData();
      } else {
        const error = await res.json();
        alert(`Gagal memperbarui jurnal: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memperbarui jurnal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePost = async () => {
    if (!isBalanced) {
      alert("Debit dan Kredit harus seimbang (Selisih = 0) untuk memposting jurnal");
      return;
    }
    
    if (!confirm("Apakah Anda yakin ingin memposting jurnal ini?")) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/journals/${params.id}/post`, {
        method: "POST",
      });
      if (response.ok) {
        alert("Jurnal berhasil diposting");
        fetchData();
      } else {
        alert("Gagal memposting jurnal");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoid = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan (void) jurnal ini? Ini akan membuat jurnal pembalik.")) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/journals/${params.id}/void`, {
        method: "POST",
      });
      if (response.ok) {
        alert("Jurnal berhasil dibatalkan");
        fetchData();
      } else {
        alert("Gagal membatalkan jurnal");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Memuat data jurnal...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.push("/jurnal")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">
          Detail Jurnal: {entryNumber}
        </h2>
        {status === "POSTED" && <Badge className="bg-green-500">Posted</Badge>}
        {status === "DRAFT" && <Badge className="bg-yellow-500">Draft</Badge>}
        {status === "VOID" && <Badge variant="destructive">Void</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Jurnal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!isEditable}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referensi (Opsional)</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={!isEditable}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Keterangan Jurnal</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isEditable}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Baris Jurnal</CardTitle>
          {isEditable && (
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Baris
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Akun</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="w-[200px] text-right">Debit</TableHead>
                  <TableHead className="w-[200px] text-right">Kredit</TableHead>
                  {isEditable && <TableHead className="w-[60px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      {isEditable ? (
                        <Select
                          value={line.accountId}
                          onValueChange={(val) => updateLine(line.id, "accountId", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Akun" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span>
                          {accounts.find((a) => a.id === line.accountId)?.code} -{" "}
                          {accounts.find((a) => a.id === line.accountId)?.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.id, "description", e.target.value)}
                        />
                      ) : (
                        <span>{line.description}</span>
                      )}
                    </TableCell>
                    <TableCell className={isEditable ? "" : "text-right"}>
                      {isEditable ? (
                        <Input
                          type="number"
                          min="0"
                          className="text-right"
                          value={line.debit || ""}
                          onChange={(e) => updateLine(line.id, "debit", parseFloat(e.target.value) || 0)}
                        />
                      ) : (
                        formatRupiah(line.debit)
                      )}
                    </TableCell>
                    <TableCell className={isEditable ? "" : "text-right"}>
                      {isEditable ? (
                        <Input
                          type="number"
                          min="0"
                          className="text-right"
                          value={line.credit || ""}
                          onChange={(e) => updateLine(line.id, "credit", parseFloat(e.target.value) || 0)}
                        />
                      ) : (
                        formatRupiah(line.credit)
                      )}
                    </TableCell>
                    {isEditable && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length <= 2}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col md:flex-row justify-between border-t p-6 gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground mb-1">Total Debit</span>
              <span className="text-lg font-bold">{formatRupiah(totalDebit)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground mb-1">Total Kredit</span>
              <span className="text-lg font-bold">{formatRupiah(totalCredit)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground mb-1">Selisih</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${selisih > 0 ? "text-red-500" : "text-green-500"}`}>
                  {formatRupiah(selisih)}
                </span>
                {isBalanced ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {status === "DRAFT" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                >
                  Simpan Perubahan
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handlePost}
                  disabled={isSubmitting || !isBalanced}
                >
                  Posting Jurnal
                </Button>
              </>
            )}
            {status === "POSTED" && (
              <Button
                variant="destructive"
                onClick={handleVoid}
                disabled={isSubmitting}
              >
                Batalkan (Void)
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
