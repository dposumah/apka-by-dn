'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PajakPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Pengaturan Pajak</CardTitle>
        <Button>Tambah Pajak</Button>
      </CardHeader>
      <CardContent>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Nama</th>
              <th className="text-left p-2">Tarif (%)</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">PPN</td>
              <td className="p-2">11%</td>
              <td className="p-2">Aktif</td>
              <td className="p-2"><Button variant="outline" size="sm">Edit</Button></td>
            </tr>
            <tr className="border-b">
              <td className="p-2">PPh Final 0.5%</td>
              <td className="p-2">0.5%</td>
              <td className="p-2">Aktif</td>
              <td className="p-2"><Button variant="outline" size="sm">Edit</Button></td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
