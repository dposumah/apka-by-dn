'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/format';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  CreditCard,
  Landmark,
  ChevronRight,
  Info,
  ExternalLink,
  BookOpen,
  FolderKanban,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';

interface DashboardData {
  summary: {
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
    totalAccountsReceivable: number;
    totalAccountsPayable: number;
    cashAndBank: number;
  };
  monthlyData: {
    name: string;
    pendapatan: number;
    beban: number;
  }[];
  expenseCategories: {
    name: string;
    value: number;
  }[];
  recentJournals: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: string;
  }[];
  overdueInvoices: {
    id: string;
    invoiceNumber: string;
    dueDate: string;
    customer: string;
    amount: number;
  }[];
  lowStockAlerts: {
    id: string;
    name: string;
    currentStock: number;
    minStock: number;
  }[];
  details?: {
    revenue: {
      total: number;
      byAccount: { code: string; name: string; amount: number; percentage: number }[];
      transactions: {
        id: string;
        date: string;
        entryNumber: string;
        description: string;
        accountName: string;
        amount: number;
      }[];
    };
    expense: {
      total: number;
      byAccount: { code: string; name: string; amount: number; percentage: number }[];
      transactions: {
        id: string;
        date: string;
        entryNumber: string;
        description: string;
        accountName: string;
        amount: number;
      }[];
    };
    profit: {
      revenue: number;
      expense: number;
      netProfit: number;
      profitMargin: number;
      status: string;
    };
    receivable: {
      total: number;
      invoices: {
        id: string;
        number: string;
        customer: string;
        dueDate: string;
        total: number;
        remaining: number;
        status: string;
      }[];
    };
    payable: {
      total: number;
      bills: {
        id: string;
        number: string;
        supplier: string;
        dueDate: string;
        total: number;
        remaining: number;
        status: string;
      }[];
    };
    cashAndBank: {
      total: number;
      accounts: {
        id: string;
        code: string;
        name: string;
        subType: string;
        balance: number;
      }[];
    };
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<
    'REVENUE' | 'EXPENSE' | 'PROFIT' | 'RECEIVABLE' | 'PAYABLE' | 'CASH' | null
  >(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Gagal mengambil data dashboard');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Klik pada setiap kartu ringkasan untuk melihat rincian akun dan riwayat transaksi.
          </p>
        </div>
        <Link href="/analisis-ai">
          <Button className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-md gap-2">
            <Sparkles size={16} className="text-amber-300" />
            <span>✨ Buka Analisis AI Keuangan</span>
          </Button>
        </Link>
      </div>

      {/* Interactive Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Total Pendapatan */}
        <Card
          onClick={() => setActiveModal('REVENUE')}
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-emerald-400 hover:-translate-y-0.5 active:scale-[0.99] group relative overflow-hidden"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan (Bulan Ini)</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(data?.summary.totalRevenue || 0)}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                  <span className="font-medium text-emerald-600 group-hover:underline flex items-center gap-1">
                    Lihat Rincian Akun & Transaksi
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 2. Total Beban */}
        <Card
          onClick={() => setActiveModal('EXPENSE')}
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-rose-400 hover:-translate-y-0.5 active:scale-[0.99] group relative overflow-hidden"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beban (Bulan Ini)</CardTitle>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors shadow-sm">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : (
              <>
                <div className="text-2xl font-bold text-rose-600">
                  {formatCurrency(data?.summary.totalExpense || 0)}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                  <span className="font-medium text-rose-600 group-hover:underline flex items-center gap-1">
                    Lihat Rincian Akun & Transaksi
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Laba/Rugi Bersih */}
        <Card
          onClick={() => setActiveModal('PROFIT')}
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 active:scale-[0.99] group relative overflow-hidden"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba/Rugi Bersih (Bulan Ini)</CardTitle>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
              <Landmark className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${
                    (data?.summary.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(data?.summary.netProfit || 0)}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                  <span className="font-medium text-blue-600 group-hover:underline flex items-center gap-1">
                    Analisis Surplus & Margin
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 4. Total Piutang */}
        <Card
          onClick={() => setActiveModal('RECEIVABLE')}
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-orange-400 hover:-translate-y-0.5 active:scale-[0.99] group relative overflow-hidden"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-sm">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data?.summary.totalAccountsReceivable || 0)}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                  <span className="font-medium text-orange-600 group-hover:underline flex items-center gap-1">
                    Status Invoice & Pelanggan
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-orange-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 5. Total Hutang */}
        <Card
          onClick={() => setActiveModal('PAYABLE')}
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-purple-400 hover:-translate-y-0.5 active:scale-[0.99] group relative overflow-hidden"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hutang</CardTitle>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data?.summary.totalAccountsPayable || 0)}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                  <span className="font-medium text-purple-600 group-hover:underline flex items-center gap-1">
                    Tagihan Hutang Supplier
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 6. Saldo Kas & Bank */}
        <Card
          onClick={() => setActiveModal('CASH')}
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-teal-400 hover:-translate-y-0.5 active:scale-[0.99] group relative overflow-hidden"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas & Bank</CardTitle>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-sm">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : (
              <>
                <div className="text-2xl font-bold text-teal-600">
                  {formatCurrency(data?.summary.cashAndBank || 0)}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                  <span className="font-medium text-teal-600 group-hover:underline flex items-center gap-1">
                    Rincian Kas & Rekening Bank
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-teal-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Advisory Quick Bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-indigo-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-amber-300 border border-indigo-400/20 shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">Konsultan Finansial AI (Google Gemini)</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Surplus Bersih 93.1%
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Dapatkan rekomendasi strategis pemangkasan beban operasional, pengelolaan likuiditas kas, dan peluang peningkatan profit untuk PT. JT Robotic Explorer.
            </p>
          </div>
        </div>
        <Link href="/analisis-ai" className="shrink-0">
          <Button size="sm" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold gap-1.5 w-full sm:w-auto shadow">
            <span>Buka Rekomendasi AI</span>
            <ChevronRight size={14} />
          </Button>
        </Link>
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart Pendapatan vs Beban */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Pendapatan vs Beban (6 Bulan Terakhir)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data?.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `Rp ${value / 1000000}M`} />
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="pendapatan" name="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="beban" name="Beban" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart Kategori Beban */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Rincian Beban</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                {data?.expenseCategories && data.expenseCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">Tidak ada data beban</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Transaksi Terakhir */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentJournals && data.recentJournals.length > 0 ? (
                    data.recentJournals.map((journal) => (
                      <TableRow key={journal.id}>
                        <TableCell>{journal.date}</TableCell>
                        <TableCell>{journal.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{journal.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(journal.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                        Belum ada transaksi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Peringatan & Jatuh Tempo */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-red-600 flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Faktur Jatuh Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[100px] w-full" />
              ) : (
                <div className="space-y-4">
                  {data?.overdueInvoices && data.overdueInvoices.length > 0 ? (
                    data.overdueInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-muted-foreground">{invoice.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">
                            {formatCurrency(invoice.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">{invoice.dueDate}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Tidak ada faktur jatuh tempo
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-600 flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Stok Menipis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[100px] w-full" />
              ) : (
                <div className="space-y-4">
                  {data?.lowStockAlerts && data.lowStockAlerts.length > 0 ? (
                    data.lowStockAlerts.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0"
                      >
                        <p className="font-medium">{item.name}</p>
                        <p className="text-orange-600 font-medium">
                          {item.currentStock}{' '}
                          <span className="text-xs text-muted-foreground">
                            / {item.minStock}
                          </span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Stok aman
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ==================== INTERACTIVE DETAIL DIALOG ==================== */}
      <Dialog
        open={activeModal !== null}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {/* 1. REVENUE MODAL */}
          {activeModal === 'REVENUE' && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Rincian Total Pendapatan</DialogTitle>
                    <DialogDescription>
                      Realisasi seluruh pendapatan operasional & proyek periode bulan ini.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Total Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Total Pendapatan Terverifikasi
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-700">
                    {formatCurrency(data?.details?.revenue.total || data?.summary.totalRevenue || 0)}
                  </p>
                </div>
                <div className="text-xs text-emerald-700 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium self-start sm:self-auto">
                  {data?.details?.revenue.byAccount.length || 0} Akun Pendapatan Aktif
                </div>
              </div>

              {/* Tabs: Breakdown & Transactions */}
              <Tabs defaultValue="akun" className="w-full">
                <TabsList className="grid grid-cols-2 w-full max-w-xs mb-3">
                  <TabsTrigger value="akun">Rincian per Akun</TabsTrigger>
                  <TabsTrigger value="transaksi">
                    Transaksi Jurnal ({data?.details?.revenue.transactions.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="akun">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Kode & Akun</TableHead>
                          <TableHead className="w-32">Kontribusi</TableHead>
                          <TableHead className="text-right">Nominal (Rp)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.details?.revenue.byAccount &&
                        data.details.revenue.byAccount.length > 0 ? (
                          data.details.revenue.byAccount.map((acc) => (
                            <TableRow key={acc.code}>
                              <TableCell>
                                <span className="font-mono text-xs font-semibold text-slate-500 mr-2">
                                  {acc.code}
                                </span>
                                <span className="font-medium text-slate-800">{acc.name}</span>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-emerald-700">
                                    {acc.percentage}%
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-1.5 rounded-full"
                                      style={{ width: `${Math.min(acc.percentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold text-emerald-600">
                                {formatCurrency(acc.amount)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                              Belum ada pendapatan yang tercatat pada bulan ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="transaksi">
                  <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0">
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>No. Jurnal</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.details?.revenue.transactions &&
                        data.details.revenue.transactions.length > 0 ? (
                          data.details.revenue.transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                {tx.date}
                              </TableCell>
                              <TableCell className="font-mono text-xs font-semibold text-blue-600 whitespace-nowrap">
                                {tx.entryNumber}
                              </TableCell>
                              <TableCell className="text-xs text-slate-700">
                                <div>{tx.description}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {tx.accountName}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-xs text-emerald-600 whitespace-nowrap">
                                {formatCurrency(tx.amount)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                              Tidak ada riwayat transaksi pendapatan bulan ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex flex-wrap gap-2 pt-3 border-t">
                <Link href="/jurnal">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <BookOpen size={14} /> Jurnal Umum
                  </Button>
                </Link>
                <Link href="/laporan/kka-snt">
                  <Button variant="outline" size="sm" className="gap-1.5 text-emerald-700">
                    <FolderKanban size={14} /> Laporan Proyek SNT
                  </Button>
                </Link>
                <Link href="/laporan/laba-rugi">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                    <FileSpreadsheet size={14} /> Laporan Laba Rugi
                  </Button>
                </Link>
              </DialogFooter>
            </div>
          )}

          {/* 2. EXPENSE MODAL */}
          {activeModal === 'EXPENSE' && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Rincian Total Beban</DialogTitle>
                    <DialogDescription>
                      Rincian seluruh beban operasional dan biaya kegiatan bulan ini.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Total Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-transparent border border-rose-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
                    Total Pengeluaran Beban
                  </p>
                  <p className="text-2xl font-extrabold text-rose-700">
                    {formatCurrency(data?.details?.expense.total || data?.summary.totalExpense || 0)}
                  </p>
                </div>
                <div className="text-xs text-rose-700 bg-white/80 px-3 py-1.5 rounded-lg border border-rose-200 font-medium self-start sm:self-auto">
                  {data?.details?.expense.byAccount.length || 0} Akun Beban Aktif
                </div>
              </div>

              {/* Tabs: Breakdown & Transactions */}
              <Tabs defaultValue="akun" className="w-full">
                <TabsList className="grid grid-cols-2 w-full max-w-xs mb-3">
                  <TabsTrigger value="akun">Rincian per Akun</TabsTrigger>
                  <TabsTrigger value="transaksi">
                    Transaksi Jurnal ({data?.details?.expense.transactions.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="akun">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Kode & Akun</TableHead>
                          <TableHead className="w-32">Porsi</TableHead>
                          <TableHead className="text-right">Nominal (Rp)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.details?.expense.byAccount &&
                        data.details.expense.byAccount.length > 0 ? (
                          data.details.expense.byAccount.map((acc) => (
                            <TableRow key={acc.code}>
                              <TableCell>
                                <span className="font-mono text-xs font-semibold text-slate-500 mr-2">
                                  {acc.code}
                                </span>
                                <span className="font-medium text-slate-800">{acc.name}</span>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-rose-700">
                                    {acc.percentage}%
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-rose-500 h-1.5 rounded-full"
                                      style={{ width: `${Math.min(acc.percentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold text-rose-600">
                                {formatCurrency(acc.amount)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                              Belum ada beban yang tercatat pada bulan ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="transaksi">
                  <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0">
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>No. Jurnal</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.details?.expense.transactions &&
                        data.details.expense.transactions.length > 0 ? (
                          data.details.expense.transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                {tx.date}
                              </TableCell>
                              <TableCell className="font-mono text-xs font-semibold text-blue-600 whitespace-nowrap">
                                {tx.entryNumber}
                              </TableCell>
                              <TableCell className="text-xs text-slate-700">
                                <div>{tx.description}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {tx.accountName}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-xs text-rose-600 whitespace-nowrap">
                                {formatCurrency(tx.amount)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                              Tidak ada riwayat transaksi beban bulan ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex flex-wrap gap-2 pt-3 border-t">
                <Link href="/pengeluaran">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Wallet size={14} /> Pengeluaran SNT
                  </Button>
                </Link>
                <Link href="/jurnal">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <BookOpen size={14} /> Jurnal Umum
                  </Button>
                </Link>
                <Link href="/laporan/laba-rugi">
                  <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5">
                    <FileSpreadsheet size={14} /> Laporan Laba Rugi
                  </Button>
                </Link>
              </DialogFooter>
            </div>
          )}

          {/* 3. PROFIT MODAL */}
          {activeModal === 'PROFIT' && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Analisis Laba / Rugi Bersih</DialogTitle>
                    <DialogDescription>
                      Kalkulasi kinerja keuangan murni antara pendapatan dan seluruh beban.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Formula Card */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Total Pendapatan (Bulan Ini)</span>
                  <span className="font-bold text-emerald-600">
                    + {formatCurrency(data?.summary.totalRevenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Total Beban Operasional & Proyek</span>
                  <span className="font-bold text-rose-600">
                    - {formatCurrency(data?.summary.totalExpense || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Laba (Rugi) Bersih Berjalan
                    </p>
                    <Badge
                      className={
                        (data?.summary.netProfit || 0) >= 0
                          ? 'bg-blue-600 text-white mt-1'
                          : 'bg-rose-600 text-white mt-1'
                      }
                    >
                      {(data?.summary.netProfit || 0) >= 0
                        ? 'SURPLUS KEUNTUNGAN'
                        : 'DEFISIT BERJALAN'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-extrabold ${
                        (data?.summary.netProfit || 0) >= 0 ? 'text-blue-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(data?.summary.netProfit || 0)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Margin Keuntungan: <span className="font-bold text-slate-800">{data?.details?.profit.profitMargin || 0}%</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Friendly Explanation */}
              <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-900">Penjelasan Ringkas</p>
                  <p className="text-blue-800 leading-relaxed">
                    Laba Bersih adalah sisa dana bersih dari pendapatan riil yang masuk setelah dikurangi
                    seluruh pengeluaran operasional dan biaya kegiatan yang telah dibukukan. Angka surplus
                    menunjukkan dana operasional perusahaan berada dalam posisi sehat.
                  </p>
                </div>
              </div>

              <DialogFooter className="flex flex-wrap gap-2 pt-3 border-t">
                <Link href="/laporan/arus-kas">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Wallet size={14} /> Laporan Arus Kas
                  </Button>
                </Link>
                <Link href="/laporan/kka-snt">
                  <Button variant="outline" size="sm" className="gap-1.5 text-emerald-700">
                    <FolderKanban size={14} /> Laporan Proyek SNT
                  </Button>
                </Link>
                <Link href="/laporan/laba-rugi">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                    <FileSpreadsheet size={14} /> Laporan Laba Rugi
                  </Button>
                </Link>
              </DialogFooter>
            </div>
          )}

          {/* 4. RECEIVABLE MODAL */}
          {activeModal === 'RECEIVABLE' && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Rincian Piutang Usaha</DialogTitle>
                    <DialogDescription>
                      Daftar tagihan penjualan / invoice yang belum dilunasi oleh pelanggan.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider">
                    Total Piutang Berjalan
                  </p>
                  <p className="text-2xl font-extrabold text-orange-700">
                    {formatCurrency(data?.summary.totalAccountsReceivable || 0)}
                  </p>
                </div>
              </div>

              {data?.details?.receivable.invoices && data.details.receivable.invoices.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>No. Invoice</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-right">Sisa Piutang</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.details.receivable.invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs font-semibold text-blue-600">
                            {inv.number}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-800">
                            {inv.customer}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{inv.dueDate}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-orange-600">
                            {formatCurrency(inv.remaining)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center border rounded-lg bg-slate-50 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-slate-800">Tidak Ada Piutang Tertunggak</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Seluruh transaksi penjualan dan tagihan invoice saat ini berstatus lunas atau belum ada
                    faktur piutang yang jatuh tempo.
                  </p>
                </div>
              )}

              <DialogFooter className="flex flex-wrap gap-2 pt-3 border-t">
                <Link href="/piutang/aging">
                  <Button variant="outline" size="sm">
                    Laporan Aging Piutang
                  </Button>
                </Link>
                <Link href="/piutang/invoice/baru">
                  <Button variant="outline" size="sm">
                    Buat Invoice Baru
                  </Button>
                </Link>
                <Link href="/piutang">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    Kelola Piutang Usaha
                  </Button>
                </Link>
              </DialogFooter>
            </div>
          )}

          {/* 5. PAYABLE MODAL */}
          {activeModal === 'PAYABLE' && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Rincian Hutang Usaha</DialogTitle>
                    <DialogDescription>
                      Daftar tagihan operasional dari supplier/vendor yang belum dibayarkan.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    Total Hutang Berjalan
                  </p>
                  <p className="text-2xl font-extrabold text-purple-700">
                    {formatCurrency(data?.summary.totalAccountsPayable || 0)}
                  </p>
                </div>
              </div>

              {data?.details?.payable.bills && data.details.payable.bills.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>No. Tagihan</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-right">Sisa Hutang</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.details.payable.bills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-mono text-xs font-semibold text-blue-600">
                            {bill.number}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-800">
                            {bill.supplier}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{bill.dueDate}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-purple-600">
                            {formatCurrency(bill.remaining)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center border rounded-lg bg-slate-50 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-slate-800">Tidak Ada Hutang Tertunggak</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Seluruh kewajiban hutang operasional dan tagihan supplier saat ini berstatus lunas.
                  </p>
                </div>
              )}

              <DialogFooter className="flex flex-wrap gap-2 pt-3 border-t">
                <Link href="/hutang/aging">
                  <Button variant="outline" size="sm">
                    Laporan Aging Hutang
                  </Button>
                </Link>
                <Link href="/hutang/tagihan/baru">
                  <Button variant="outline" size="sm">
                    Input Tagihan Baru
                  </Button>
                </Link>
                <Link href="/hutang">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Kelola Hutang Usaha
                  </Button>
                </Link>
              </DialogFooter>
            </div>
          )}

          {/* 6. CASH & BANK MODAL */}
          {activeModal === 'CASH' && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Rincian Saldo Kas & Bank</DialogTitle>
                    <DialogDescription>
                      Posisi saldo likuid di seluruh rekening perbankan dan kas tunai perusahaan.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                    Total Likuiditas Kas & Bank
                  </p>
                  <p className="text-2xl font-extrabold text-teal-700">
                    {formatCurrency(data?.summary.cashAndBank || 0)}
                  </p>
                </div>
                <div className="text-xs text-teal-700 bg-white/80 px-3 py-1.5 rounded-lg border border-teal-200 font-medium">
                  {data?.details?.cashAndBank.accounts.length || 0} Rekening / Akun
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Kode Akun</TableHead>
                      <TableHead>Nama Akun / Rekening</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Saldo Saat Ini</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.details?.cashAndBank.accounts &&
                    data.details.cashAndBank.accounts.length > 0 ? (
                      data.details.cashAndBank.accounts.map((acc) => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-mono text-xs font-semibold text-slate-500">
                            {acc.code}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 text-xs sm:text-sm">
                            {acc.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {acc.subType || 'Kas & Bank'}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold text-xs sm:text-sm ${
                              acc.balance > 0
                                ? 'text-teal-700'
                                : acc.balance < 0
                                ? 'text-rose-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {formatCurrency(acc.balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          Tidak ada data akun kas & bank.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="flex flex-wrap gap-2 pt-3 border-t">
                <Link href="/bank/rekonsiliasi">
                  <Button variant="outline" size="sm">
                    Rekonsiliasi Bank
                  </Button>
                </Link>
                <Link href="/laporan/arus-kas">
                  <Button variant="outline" size="sm">
                    Laporan Arus Kas
                  </Button>
                </Link>
                <Link href="/bank/akun">
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                    Kelola Akun Bank
                  </Button>
                </Link>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
