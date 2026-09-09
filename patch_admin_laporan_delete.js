const fs = require('fs');
const filePath = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add import
if (!code.includes('deleteLaporanKegiatan')) {
  code = code.replace(
    "import { useState } from 'react'",
    "import { useState } from 'react'\nimport { deleteLaporanKegiatan } from '@/app/actions/rab'\nimport { Trash2 } from 'lucide-react'\nimport { useRouter } from 'next/navigation'"
  );
}

// Add state & handler
const stateCode = `
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (lapId: string, fasilitatorId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setDeletingId(lapId);
    try {
      await deleteLaporanKegiatan(lapId, fasilitatorId);
      alert('Laporan berhasil dihapus');
      // trigger hard refresh to clear cache if needed, though server action revalidates
      router.refresh();
    } catch (e: any) {
      alert('Gagal menghapus laporan: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  }
`;

if (!code.includes('handleDelete')) {
  code = code.replace(
    "const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1)",
    stateCode + "\n  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1)"
  );
}

// Add UI button
const btnCode = `
                        {/* For uploading receipt, Admin uses the Rekap Transport page, or we can add it here too. */}
                        <button 
                          onClick={() => handleDelete(lap.id, lap.fasilitatorId)}
                          disabled={deletingId === lap.id}
                          className="w-full mt-2 flex items-center justify-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          {deletingId === lap.id ? 'Menghapus...' : 'Hapus Laporan'}
                        </button>
`;

if (!code.includes('Hapus Laporan')) {
  code = code.replace(
    "{/* For uploading receipt, Admin uses the Rekap Transport page, or we can add it here too. */}",
    btnCode
  );
}

fs.writeFileSync(filePath, code);
console.log("Patched admin laporan with delete button");
