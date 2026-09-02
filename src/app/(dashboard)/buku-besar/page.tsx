"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Search, Download, Printer } from "lucide-react";

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
};

type LedgerLine = {
  id: string;
  date: string;
  entryNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

type LedgerData = {
  account: Account;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  lines: LedgerLine[];
};

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BukuBesarPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [dateFrom, setDateFrom] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd")
  );
  
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    if (!selectedAccountId) {
      alert("Silakan pilih akun terlebih dahulu");
      return;
    }

    try {
      setLoading(true);
      const query = new URLSearchParams({
        accountId: selectedAccountId,
      });
      if (dateFrom) query.append("dateFrom", dateFrom);
      if (dateTo) query.append("dateTo", dateTo);

      const res = await fetch(`/api/ledger?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLedgerData(data);
      } else {
        alert("Gagal mengambil data buku besar");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: "pdf" | "excel") => {
    // In a real app, you would generate and download the file here
    alert(`Fitur export ke ${type.toUpperCase()} akan segera tersedia.`);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Buku Besar</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport("excel")} disabled={!ledgerData}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")} disabled={!ledgerData}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>
            Pilih akun dan periode tanggal untuk menampilkan buku besar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="account">Akun</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Dari Tanggal</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Sampai Tanggal</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Tampilkan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {ledgerData && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <CardTitle className="text-xl">
                  {ledgerData.account.code} - {ledgerData.account.name}
                </CardTitle>
                <CardDescription>
                  Periode: {dateFrom ? format(new Date(dateFrom), "dd MMM yyyy", { locale: localeId }) : "Awal"} s/d{" "}
                  {dateTo ? format(new Date(dateTo), "dd MMM yyyy", { locale: localeId }) : "Akhir"}
                </CardDescription>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-sm text-muted-foreground">Saldo Akhir</div>
                <div className="text-2xl font-bold">{formatRupiah(ledgerData.closingBalance)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Tanggal</TableHead>
                    <TableHead className="w-[150px]">No. Jurnal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right w-[150px]">Debit</TableHead>
                    <TableHead className="text-right w-[150px]">Kredit</TableHead>
                    <TableHead className="text-right w-[150px]">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={3} className="font-medium text-right">
                      Saldo Awal
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-bold text-right">
                      {formatRupiah(ledgerData.openingBalance)}
                    </TableCell>
                  </TableRow>
                  
                  {ledgerData.lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        Tidak ada transaksi pada periode ini
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerData.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          {format(new Date(line.date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{line.entryNumber}</TableCell>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right">
                          {line.debit > 0 ? formatRupiah(line.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.credit > 0 ? formatRupiah(line.credit) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRupiah(line.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={3} className="font-medium text-right">
                      Total / Saldo Akhir
                    </TableCell>
                    <TableCell className="font-bold text-right text-blue-600">
                      {formatRupiah(ledgerData.totalDebit)}
                    </TableCell>
                    <TableCell className="font-bold text-right text-red-600">
                      {formatRupiah(ledgerData.totalCredit)}
                    </TableCell>
                    <TableCell className="font-bold text-right">
                      {formatRupiah(ledgerData.closingBalance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
