'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Building2, Save } from 'lucide-react';

export default function PerusahaanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    npwp: ''
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          npwp: data.npwp || ''
        });
      }
    } catch (error) {
      console.error('Failed to load company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast({
          title: "Sukses",
          description: "Profil perusahaan berhasil diperbarui.",
          type: "success"
        });
      } else {
        throw new Error('Gagal menyimpan data');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan profil perusahaan.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data perusahaan...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Profil Perusahaan</h1>
          <p className="text-muted-foreground">Kelola informasi identitas perusahaan Anda di sini.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identitas Perusahaan</CardTitle>
          <CardDescription>
            Informasi ini akan ditampilkan pada kop surat laporan, invoice, dan bukti potong.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Perusahaan <span className="text-red-500">*</span></Label>
              <Input 
                id="name"
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                placeholder="Contoh: PT Apka Maju Bersama"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea 
                id="address"
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                rows={3}
                placeholder="Masukkan alamat lengkap perusahaan..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input 
                  id="phone"
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="Contoh: 021-1234567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Alamat Email</Label>
                <Input 
                  id="email"
                  name="email" 
                  type="email"
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Contoh: info@perusahaan.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="npwp">NPWP Perusahaan</Label>
              <Input 
                id="npwp"
                name="npwp" 
                value={formData.npwp} 
                onChange={handleChange} 
                placeholder="Contoh: 12.345.678.9-012.000"
              />
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
