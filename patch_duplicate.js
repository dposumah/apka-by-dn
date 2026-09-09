const fs = require('fs');
const filePath = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Remove the one I injected if it already exists
code = code.replace("import { useRouter } from 'next/navigation'\nimport { useRouter } from 'next/navigation'", "import { useRouter } from 'next/navigation'");
// or let's just do a string replace of the block I added
code = code.replace("import { deleteLaporanKegiatan } from '@/app/actions/rab'\nimport { Trash2 } from 'lucide-react'\nimport { useRouter } from 'next/navigation'", "import { deleteLaporanKegiatan } from '@/app/actions/rab'\nimport { Trash2 } from 'lucide-react'");

fs.writeFileSync(filePath, code);
console.log("Fixed duplicate useRouter");
