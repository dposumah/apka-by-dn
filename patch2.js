const fs = require('fs');
const filePath = 'src/app/(snt)/portal/laporan/client-form.tsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('useToast')) {
  code = code.replace(
    "import { submitLaporanKegiatan } from '@/app/actions/rab'",
    "import { submitLaporanKegiatan } from '@/app/actions/rab'\nimport { useToast } from '@/components/ui/toast'"
  );
}

if (!code.includes('const { toast } = useToast()')) {
  code = code.replace(
    "const router = useRouter()",
    "const router = useRouter()\n  const { toast } = useToast()"
  );
}

code = code.replace(
  "alert(\"Gagal mengirim laporan\")",
  "toast({ title: 'Gagal', description: 'Gagal mengirim laporan', type: 'error' })"
);

fs.writeFileSync(filePath, code);
console.log("Patched client-form.tsx");
