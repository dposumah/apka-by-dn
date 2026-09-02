'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PenggunaPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Manajemen Pengguna</CardTitle>
        <Button>Tambah Pengguna</Button>
      </CardHeader>
      <CardContent>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Nama</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">Admin User</td>
              <td className="p-2">admin@apka.com</td>
              <td className="p-2"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">ADMIN</span></td>
              <td className="p-2">
                <Button variant="outline" size="sm">Edit</Button>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
