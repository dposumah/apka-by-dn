const fs = require('fs');
const path = 'src/app/(snt)/fasilitator/rekap-honor/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { getFasilitatorJpForMonth } from '@/app/actions/rekap'",
  "import { getFasilitatorJpForMonth, syncLaporanToRekap } from '@/app/actions/rekap'"
);

const syncButtonLogic = `
  const handleSync = async (id: string) => {
    if (confirm('Tautkan semua laporan telat di bulan ini ke rekap ini? (Angka Honor tidak akan berubah)')) {
      try {
        const count = await syncLaporanToRekap(id)
        alert(\`Berhasil menautkan \${count} laporan.\`)
        router.refresh()
      } catch (e: any) {
        alert(e.message)
      }
    }
  }
`;
if(!content.includes('handleSync')) {
    content = content.replace(
      "const handleDelete = async (id: string) => {",
      syncButtonLogic + "\n  const handleDelete = async (id: string) => {"
    );
}


const actionButtonsRegex = /<button \s*onClick=\{\(\) => handleDelete\(rekap\.id\)\}\s*className="text-xs bg-red-600 text-white hover:bg-red-700 rounded px-2 py-1\.5 transition-\n?colors whitespace-nowrap"\s*>\s*Hapus\s*<\/button>/;

content = content.replace(
  actionButtonsRegex,
  `<button onClick={() => handleDelete(rekap.id)} className="text-xs bg-red-600 text-white hover:bg-red-700 rounded px-2 py-1.5 transition-colors whitespace-nowrap">Hapus</button>
                            <button onClick={() => handleSync(rekap.id)} className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap" title="Tautkan laporan mingguan fasilitator yang telat ke rekap ini (Tidak merubah honor)">Tautkan</button>`
);


fs.writeFileSync(path, content);
console.log('Added Sync Button');
