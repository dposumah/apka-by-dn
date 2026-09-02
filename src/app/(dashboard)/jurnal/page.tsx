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
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, Edit, Trash, Plus, Search } from "lucide-react";

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

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function JurnalPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const handlePost = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin memposting jurnal ini?")) return;
    try {
      const response = await fetch(`/api/journals/${id}/post`, {
        method: "POST",
      });
      if (response.ok) fetchJournals();
      else alert("Gagal memposting jurnal");
    } catch (error) {
      console.error(error);
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan (void) jurnal ini?")) return;
    try {
      const response = await fetch(`/api/journals/${id}/void`, {
        method: "POST",
      });
      if (response.ok) fetchJournals();
      else alert("Gagal membatalkan jurnal");
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
                        <div className="flex justify-center gap-2">
                          <Link href={`/jurnal/${journal.id}`}>
                            <Button variant="outline" size="sm" title="Lihat/Edit">
                              {journal.status === "DRAFT" ? (
                                <Edit className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </Link>
                          {journal.status === "DRAFT" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handlePost(journal.id)}
                              title="Posting"
                            >
                              Post
                            </Button>
                          )}
                          {journal.status === "POSTED" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleVoid(journal.id)}
                              title="Void"
                            >
                              Void
                            </Button>
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
    </div>
  );
}
