'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';

const accountSchema = z.object({
  code: z.string().min(1, 'Kode akun harus diisi'),
  name: z.string().min(1, 'Nama akun harus diisi'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], {
    required_error: 'Tipe akun harus dipilih',
  }),
  subType: z.string().optional(),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  parentId: z.string().optional().nullable(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountFormProps {
  initialData?: any;
  onSuccess: () => void;
  accounts: any[];
}

export default function AccountForm({ initialData, onSuccess, accounts }: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: initialData || {
      code: '',
      name: '',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      isActive: true,
      subType: '',
      parentId: 'none',
      description: '',
    },
  });

  const watchType = form.watch('type');

  // Auto set normal balance based on account type
  useEffect(() => {
    if (watchType === 'ASSET' || watchType === 'EXPENSE') {
      form.setValue('normalBalance', 'DEBIT');
    } else if (watchType === 'LIABILITY' || watchType === 'EQUITY' || watchType === 'REVENUE') {
      form.setValue('normalBalance', 'CREDIT');
    }
  }, [watchType, form]);

  const onSubmit = async (data: AccountFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        parentId: data.parentId === 'none' ? null : data.parentId,
      };

      const url = initialData ? `/api/accounts/${initialData.id}` : '/api/accounts';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Terjadi kesalahan');
      }

      toast({
        title: "Sukses",
        description: initialData ? "Akun berhasil diperbarui" : "Akun berhasil dibuat",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Akun</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: 1-1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Akun</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Kas Kecil" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Akun</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tipe Akun" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ASSET">Aset</SelectItem>
                    <SelectItem value="LIABILITY">Liabilitas</SelectItem>
                    <SelectItem value="EQUITY">Ekuitas</SelectItem>
                    <SelectItem value="REVENUE">Pendapatan</SelectItem>
                    <SelectItem value="EXPENSE">Beban</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="normalBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Normal</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Saldo Normal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DEBIT">Debit</SelectItem>
                    <SelectItem value="CREDIT">Kredit</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Diatur otomatis</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Akun Induk (Opsional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Akun Induk" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">-- Tidak Ada Induk (Root) --</SelectItem>
                    {accounts.filter(a => a.id !== initialData?.id).map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea placeholder="Keterangan opsional mengenai akun ini" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Status Aktif</FormLabel>
                  <FormDescription>
                    Akun yang tidak aktif tidak akan muncul di pilihan jurnal
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onSuccess()} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : 'Simpan Akun'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
