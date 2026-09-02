import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

export const accountSchema = z.object({
  code: z.string().min(1, "Kode akun wajib diisi"),
  name: z.string().min(1, "Nama akun wajib diisi"),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  description: z.string().optional(),
});

export const journalEntryLineSchema = z.object({
  accountId: z.string().min(1, "Akun wajib dipilih"),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
});

export const journalEntrySchema = z.object({
  date: z.date({ required_error: "Tanggal wajib diisi" }),
  reference: z.string().optional(),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  lines: z.array(journalEntryLineSchema).min(2, "Minimal 2 baris jurnal"),
}).refine(data => {
  const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, { message: "Total Debit dan Kredit harus seimbang", path: ["lines"] });

export const contactSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal('')),
  npwp: z.string().optional(),
});

export const customerSchema = contactSchema;
export const supplierSchema = contactSchema;

export const invoiceLineSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  quantity: z.number().min(1, "Kuantitas minimal 1"),
  unitPrice: z.number().min(0, "Harga tidak boleh negatif"),
  taxAmount: z.number().min(0).optional(),
});

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Pelanggan wajib dipilih"),
  date: z.date({ required_error: "Tanggal wajib diisi" }),
  dueDate: z.date({ required_error: "Jatuh tempo wajib diisi" }),
  reference: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1, "Minimal 1 baris produk"),
});

export const billSchema = invoiceSchema.extend({
  supplierId: z.string().min(1, "Pemasok wajib dipilih"),
}).omit({ customerId: true });

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Faktur wajib dipilih"),
  bankAccountId: z.string().min(1, "Akun kas/bank wajib dipilih"),
  date: z.date({ required_error: "Tanggal bayar wajib diisi" }),
  amount: z.number().min(1, "Jumlah bayar harus lebih dari 0"),
  reference: z.string().optional(),
});

export const billPaymentSchema = paymentSchema.extend({
  billId: z.string().min(1, "Tagihan wajib dipilih"),
}).omit({ invoiceId: true });

export const productSchema = z.object({
  sku: z.string().min(1, "SKU wajib diisi"),
  name: z.string().min(1, "Nama produk wajib diisi"),
  type: z.enum(['INVENTORY', 'SERVICE']),
  price: z.number().min(0),
  cost: z.number().min(0),
  unit: z.string().min(1, "Satuan wajib diisi"),
});

export const bankAccountSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi"),
  bankName: z.string().min(1, "Nama bank wajib diisi"),
  accountNumber: z.string().min(1, "Nomor rekening wajib diisi"),
  balance: z.number().default(0),
});

export const budgetLineSchema = z.object({
  accountId: z.string().min(1, "Akun wajib dipilih"),
  amount: z.number().min(0, "Anggaran tidak boleh negatif"),
});

export const budgetSchema = z.object({
  year: z.number().min(2000).max(3000),
  month: z.number().min(1).max(12),
  name: z.string().min(1, "Nama anggaran wajib diisi"),
  lines: z.array(budgetLineSchema).min(1, "Minimal 1 baris anggaran"),
});

export const companySchema = z.object({
  name: z.string().min(1, "Nama perusahaan wajib diisi"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  npwp: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'VIEWER']),
});
