"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

type Account = {
  id: string;
  code: string;
  name: string;
};

type JournalLine = {
  id: string; // temp id for UI
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

export default function JurnalBaruPage() {
  const router = useRouter();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", accountId: "", description: "", debit: 0, credit: 0 },
    { id: "2", accountId: "", description: "", debit: 0, credit: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts?isActive=true");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addLine = () => {
    setLines([
      ...lines,
      { id: Date.now().toString(), accountId: "", description: "", debit: 0, credit: 0 },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) {
      alert("Jurnal harus memiliki minimal 2 baris");
      return;
    }
    setLines(lines.filter((line) => line.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
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

  const handleSubmit = async (status: "DRAFT" | "POSTED") => {
    if (lines.length < 2) {
      alert("Jurnal harus memiliki minimal 2 baris");
      return;
    }

    const hasEmptyAccounts = lines.some((line) => !line.accountId);
    if (hasEmptyAccounts) {
      alert("Silakan pilih akun untuk semua baris");
      return;
    }

    if (status === "POSTED" && !isBalanced) {
      alert("Debit dan Kredit harus seimbang (Selisih = 0) untuk memposting jurnal");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description,
          reference,
          status,
          lines: lines.map(({ accountId, description, debit, credit }) => ({
            accountId,
            description,
            debit: Number(debit),
            credit: Number(credit),
          })),
        }),
      });

      if (res.ok) {
        router.push("/jurnal");
      } else {
        const error = await res.json();
        alert(`Gagal menyimpan jurnal: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan jurnal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Buat Jurnal Baru</h2>
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referensi (Opsional)</Label>
              <Input
                id="reference"
                placeholder="Misal: INV-2026-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Keterangan Jurnal</Label>
              <Textarea
                id="description"
                placeholder="Keterangan umum untuk jurnal ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Baris Jurnal</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Baris
          </Button>
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
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Keterangan baris..."
                        value={line.description}
                        onChange={(e) => updateLine(line.id, "description", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="text-right"
                        value={line.debit || ""}
                        onChange={(e) => updateLine(line.id, "debit", parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="text-right"
                        value={line.credit || ""}
                        onChange={(e) => updateLine(line.id, "credit", parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
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
            <Button
              variant="outline"
              onClick={() => handleSubmit("DRAFT")}
              disabled={isSubmitting}
            >
              Simpan sebagai Draft
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleSubmit("POSTED")}
              disabled={isSubmitting || !isBalanced}
            >
              Posting Langsung
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
