const fs = require('fs');
const filePath = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Import
code = code.replace("import { Trash2 } from 'lucide-react'", "import { Trash2 } from 'lucide-react'\nimport { cancelTransportPaid } from '@/app/actions/rekap'");

// State
code = code.replace("const [deletingId, setDeletingId] = useState<string | null>(null)", "const [deletingId, setDeletingId] = useState<string | null>(null)\n  const [cancelingId, setCancelingId] = useState<string | null>(null)");

// Function
const handleFn = `
  const handleCancelPaid = async (lapId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan status Lunas untuk laporan ini? Data Pengeluaran yang terkait juga akan dihapus.')) return;
    setCancelingId(lapId);
    try {
      const res = await cancelTransportPaid(lapId);
      if (res?.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      alert('Gagal membatalkan lunas: ' + e.message);
    } finally {
      setCancelingId(null);
    }
  }
`;

code = code.replace("const cetakInvoiceTransport", handleFn + "\n  const cetakInvoiceTransport");

// Button JSX
const targetJsx = `                      {((lap.biayaTransport || 0) > 0 || (lap.biayaTransportLaut || 0) > 0) && lap.statusTransport === 'PENDING' && (
                        <button 
                          onClick={() => cetakInvoiceTransport(lap)}
                          className="w-full text-xs bg-slate-900 text-white hover:bg-slate-800 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                        >
                          Cetak Invoice Transport
                        </button>
                      )}`;
                      
const replacementJsx = `                      {((lap.biayaTransport || 0) > 0 || (lap.biayaTransportLaut || 0) > 0) && lap.statusTransport === 'PENDING' && (
                        <button 
                          onClick={() => cetakInvoiceTransport(lap)}
                          className="w-full text-xs bg-slate-900 text-white hover:bg-slate-800 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                        >
                          Cetak Invoice Transport
                        </button>
                      )}
                      {lap.statusTransport === 'PAID' && (
                        <button 
                          onClick={() => handleCancelPaid(lap.id)}
                          disabled={cancelingId === lap.id}
                          className="w-full flex items-center justify-center text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          {cancelingId === lap.id ? 'Membatalkan...' : 'Batalkan Lunas'}
                        </button>
                      )}`;

code = code.replace(targetJsx, replacementJsx);
fs.writeFileSync(filePath, code);
console.log('Added button to Laporan client page');
