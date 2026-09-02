'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type FiscalPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED';
};

export default function PeriodePage() {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      const res = await fetch('/api/settings/period');
      if (res.ok) {
        const data = await res.json();
        setPeriods(data);
      }
    } catch (error) {
      console.error('Failed to load periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const activePeriod = periods.find(p => p.status === 'OPEN');

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat periode akuntansi...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Periode Akuntansi</h1>
          <p className="text-muted-foreground">Kelola periode buku tahunan perusahaan.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Periode Aktif</CardTitle>
          <CardDescription>
            Transaksi hanya dapat dicatat pada periode yang berstatus OPEN (Berjalan).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePeriod ? (
            <div className="mb-6 p-4 border rounded-lg bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Periode Berjalan:</p>
                <p className="font-bold text-lg">
                  {format(new Date(activePeriod.startDate), 'MMMM yyyy', { locale: id })} - {' '}
                  {format(new Date(activePeriod.endDate), 'MMMM yyyy', { locale: id })}
                </p>
                <p className="text-sm font-medium mt-1">Nama: {activePeriod.name}</p>
              </div>
              <Button variant="destructive" className="flex gap-2">
                <Lock className="h-4 w-4" /> Tutup Buku
              </Button>
            </div>
          ) : (
            <div className="mb-6 p-4 border rounded-lg bg-red-50 text-red-600">
              Tidak ada periode aktif. Harap buka periode baru.
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tahun / Nama</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>Berakhir</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map(period => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.name}</TableCell>
                    <TableCell>{format(new Date(period.startDate), 'dd MMM yyyy', { locale: id })}</TableCell>
                    <TableCell>{format(new Date(period.endDate), 'dd MMM yyyy', { locale: id })}</TableCell>
                    <TableCell>
                      {period.status === 'OPEN' ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex w-fit gap-1 items-center">
                          <Unlock className="h-3 w-3" /> Berjalan
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex w-fit gap-1 items-center">
                          <Lock className="h-3 w-3" /> Ditutup
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                {periods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Tidak ada data periode ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
