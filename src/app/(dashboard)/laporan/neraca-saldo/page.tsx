"use client";

import React, { useState, useEffect } from "react";
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
import { Search, Download, Printer, CheckCircle, XCircle } from "lucide-react";

type TrialBalanceLine = {
  id: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
};

type TrialBalanceData = {
  groupedData: Record<string, TrialBalanceLine[]>;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
};

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: "Aset",
  LIABILITY: "Kewajiban",
  EQUITY: "Ekuitas",
  REVENUE: "Pendapatan",
  EXPENSE: "Beban",
};

export default function NeracaSaldoPage() {
  const [dateTo, setDateTo] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd")
  );
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrialBalanceData | null>(null);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (dateTo) query.append("dateTo", dateTo);

      const res = await fetch(`/api/reports/trial-balance?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        alert("Gagal mengambil data neraca saldo");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, []); // Initial load

  const handleExport = (type: "pdf" | "excel") => {
    alert(`Fitur export ke ${type.toUpperCase()} akan segera tersedia.`);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Neraca Saldo</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport("excel")} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")} disabled={!data}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>
            Pilih periode tanggal untuk menampilkan neraca saldo (Trial Balance).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 w-full md:w-[300px]">
              <Label htmlFor="dateTo">Per Tanggal</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button onClick={fetchTrialBalance} disabled={loading} className="w-full md:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Tampilkan Laporan
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <div className="text-center">
              <CardTitle className="text-2xl uppercase">Neraca Saldo</CardTitle>
              <CardDescription className="text-lg mt-2">
                Per {dateTo ? format(new Date(dateTo), "dd MMMM yyyy", { locale: localeId }) : "Hari Ini"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Kode Akun</TableHead>
                    <TableHead>Nama Akun</TableHead>
                    <TableHead className="text-right w-[200px]">Debit</TableHead>
                    <TableHead className="text-right w-[200px]">Kredit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(ACCOUNT_TYPE_LABELS).map((type) => {
                    const accounts = data.groupedData[type] || [];
                    if (accounts.length === 0) return null;

                    return (
                      <React.Fragment key={type}>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-bold">
                            {ACCOUNT_TYPE_LABELS[type]}
                          </TableCell>
                        </TableRow>
                        {accounts.map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell>{acc.code}</TableCell>
                            <TableCell>{acc.name}</TableCell>
                            <TableCell className="text-right">
                              {acc.debit > 0 ? formatRupiah(acc.debit) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {acc.credit > 0 ? formatRupiah(acc.credit) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  <TableRow className="bg-muted/80 border-t-4 border-double">
                    <TableCell colSpan={2} className="font-bold text-lg text-right">
                      TOTAL
                    </TableCell>
                    <TableCell className="font-bold text-lg text-right">
                      {formatRupiah(data.totalDebit)}
                    </TableCell>
                    <TableCell className="font-bold text-lg text-right">
                      {formatRupiah(data.totalCredit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-card">
                <div className="text-sm font-medium">Status Keseimbangan:</div>
                {data.isBalanced ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-bold">SEIMBANG (BALANCED)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full">
                    <XCircle className="h-5 w-5" />
                    <span className="font-bold">TIDAK SEIMBANG (UNBALANCED)</span>
                    <span className="text-sm ml-2">
                      (Selisih: {formatRupiah(Math.abs(data.totalDebit - data.totalCredit))})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
