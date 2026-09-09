const fs = require('fs');
const filePath = 'src/app/(snt)/pengeluaran/form.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add import
if (!code.includes('useToast')) {
  code = code.replace(
    "import { submitExpense } from '@/app/actions/rab'",
    "import { submitExpense } from '@/app/actions/rab'\nimport { useToast } from '@/components/ui/toast'"
  );
}

// Add hook
if (!code.includes('const { toast } = useToast()')) {
  code = code.replace(
    "export function PengeluaranForm({ items, fasilitators }: { items: any[], fasilitators: any[] }) {",
    "export function PengeluaranForm({ items, fasilitators }: { items: any[], fasilitators: any[] }) {\n  const { toast } = useToast();"
  );
}

// Replace alert
code = code.replace(
  "alert('Pengeluaran berhasil diajukan!')",
  "toast({ title: 'Berhasil', description: 'Pengeluaran berhasil ditambahkan.', type: 'success' })"
);

code = code.replace(
  "alert(err.message || 'Gagal mengirim data')",
  "toast({ title: 'Gagal', description: err.message || 'Gagal mengirim data', type: 'error' })"
);

fs.writeFileSync(filePath, code);
console.log("Patched form.tsx");
