'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/format';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, AlertCircle, Clock, Wallet, CreditCard, Landmark } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    number: string;
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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Pendapatan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan (Bulan Ini)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-[120px]" /> : (
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(data?.summary.totalRevenue || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Beban */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beban (Bulan Ini)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-[120px]" /> : (
              <div className="text-2xl font-bold text-rose-600">
                {formatCurrency(data?.summary.totalExpense || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Laba/Rugi Bersih */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba/Rugi Bersih (Bulan Ini)</CardTitle>
            <Landmark className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-[120px]" /> : (
              <div className={`text-2xl font-bold ${
                (data?.summary.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {formatCurrency(data?.summary.netProfit || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Piutang */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-[120px]" /> : (
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(data?.summary.totalAccountsReceivable || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Hutang */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hutang</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-[120px]" /> : (
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(data?.summary.totalAccountsPayable || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saldo Kas & Bank */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas & Bank</CardTitle>
            <Wallet className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-[120px]" /> : (
              <div className="text-2xl font-bold text-teal-600">
                {formatCurrency(data?.summary.cashAndBank || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart Pendapatan vs Beban */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Pendapatan vs Beban (6 Bulan Terakhir)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? <Skeleton className="h-[350px] w-full" /> : (
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
            {loading ? <Skeleton className="h-[350px] w-full" /> : (
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
            {loading ? <Skeleton className="h-[200px] w-full" /> : (
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
                        <TableCell className="text-right">{formatCurrency(journal.amount)}</TableCell>
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
              {loading ? <Skeleton className="h-[100px] w-full" /> : (
                <div className="space-y-4">
                  {data?.overdueInvoices && data.overdueInvoices.length > 0 ? (
                    data.overdueInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          <p className="text-muted-foreground">{invoice.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">{formatCurrency(invoice.amount)}</p>
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
              {loading ? <Skeleton className="h-[100px] w-full" /> : (
                <div className="space-y-4">
                  {data?.lowStockAlerts && data.lowStockAlerts.length > 0 ? (
                    data.lowStockAlerts.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-orange-600 font-medium">
                          {item.currentStock} <span className="text-xs text-muted-foreground">/ {item.minStock}</span>
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
    </div>
  );
}
