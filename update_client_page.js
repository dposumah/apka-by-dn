const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// Add uploadBuktiRekap to imports
if (!page.includes('uploadBuktiRekap')) {
  page = page.replace(
    /import \{ deleteRekapHonor \}/,
    "import { deleteRekapHonor, uploadBuktiRekap }"
  );
}

// Add state variables for upload modal
page = page.replace(
  /const \[showKopModal, setShowKopModal\] = useState\(false\)/,
  `const [showKopModal, setShowKopModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadingRekap, setUploadingRekap] = useState<any>(null)
  const [honorFile, setHonorFile] = useState<File | null>(null)
  const [transportFile, setTransportFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)`
);

// Add table headers
page = page.replace(
  /<th className="py-3 px-4 text-center">Status<\/th>\n\s*<th className="py-3 px-4 text-center">Dokumen PDF<\/th>/,
  `<th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Total Transport</th>
                  <th className="py-3 px-4 text-center">Bukti Pembayaran</th>
                  <th className="py-3 px-4 text-center">Dokumen PDF</th>`
);

// Add table cells
page = page.replace(
  /<td className="py-3 px-4 text-center">\s*<Badge variant=\{rekap\.status === 'SUBMITTED' \? 'default' : 'secondary'\}>\{rekap\.status\}<\/Badge>\s*<\/td>\s*<td className="py-3 px-4 text-center">\s*\{rekap\.filePdf \? \(\s*<a href=\{rekap\.filePdf\}/,
  `<td className="py-3 px-4 text-center">
                      <Badge variant={rekap.status === 'SUBMITTED' ? 'default' : 'secondary'}>{rekap.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(rekap.laporan?.reduce((acc: number, lap: any) => acc + (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0), 0) || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {rekap.buktiPembayaranHonor ? (
                          <a href={rekap.buktiPembayaranHonor} target="_blank" className="text-xs text-green-600 hover:underline">✓ Honor</a>
                        ) : null}
                        {rekap.buktiPembayaranTransport ? (
                          <a href={rekap.buktiPembayaranTransport} target="_blank" className="text-xs text-green-600 hover:underline">✓ Transport</a>
                        ) : null}
                        {rekap.status === 'SUBMITTED' && (
                          <button 
                            onClick={() => { setUploadingRekap(rekap); setHonorFile(null); setTransportFile(null); setShowUploadModal(true); }}
                            className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 mt-1"
                          >
                            Upload Bukti
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rekap.filePdf ? (
                        <a href={rekap.filePdf}`
);

// Add upload handler and modal
const modalCode = `
      {/* Modal Upload Bukti Pembayaran */}
      {showUploadModal && uploadingRekap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-4">Upload Bukti Pembayaran</h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload bukti transfer untuk Fasilitator <strong>{uploadingRekap.fasilitator?.namaLengkap}</strong> (Bulan: {uploadingRekap.bulan}).<br/>
              Sistem akan otomatis memotong item RAB Fasilitator & Sewa Rumah.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="border p-4 rounded-md">
                <label className="block text-sm font-medium mb-2">1. Bukti Transfer Honorarium (Rp {formatCurrency(uploadingRekap.totalHonor)})</label>
                {uploadingRekap.buktiPembayaranHonor ? (
                  <div className="text-sm text-green-600 mb-2">✓ Sudah ada bukti terupload</div>
                ) : null}
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={(e) => setHonorFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>

              <div className="border p-4 rounded-md">
                <label className="block text-sm font-medium mb-2">2. Bukti Transfer Transportasi (Rp {formatCurrency(uploadingRekap.laporan?.reduce((acc: number, lap: any) => acc + (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0), 0) || 0)})</label>
                {uploadingRekap.buktiPembayaranTransport ? (
                  <div className="text-sm text-green-600 mb-2">✓ Sudah ada bukti terupload</div>
                ) : null}
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={(e) => setTransportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isUploading}
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  if (!honorFile && !transportFile) {
                    alert('Pilih minimal satu file bukti pembayaran');
                    return;
                  }
                  setIsUploading(true);
                  try {
                    let urlHonor;
                    let urlTransport;
                    if (honorFile) {
                      const data = new FormData(); data.append('file', honorFile);
                      const res = await fetch('/api/upload', { method: 'POST', body: data });
                      if (res.ok) { const json = await res.json(); urlHonor = json.url; } else throw new Error("Gagal upload bukti honor");
                    }
                    if (transportFile) {
                      const data = new FormData(); data.append('file', transportFile);
                      const res = await fetch('/api/upload', { method: 'POST', body: data });
                      if (res.ok) { const json = await res.json(); urlTransport = json.url; } else throw new Error("Gagal upload bukti transport");
                    }
                    
                    const result = await uploadBuktiRekap(uploadingRekap.id, urlHonor, urlTransport);
                    if (result.error) throw new Error(result.error);
                    
                    alert('Bukti pembayaran berhasil diupload & RAB berhasil dipotong!');
                    setShowUploadModal(false);
                    router.refresh();
                  } catch (err: any) {
                    console.error(err);
                    alert('Terjadi kesalahan: ' + err.message);
                  } finally {
                    setIsUploading(false);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isUploading || (!honorFile && !transportFile)}
              >
                {isUploading ? 'Mengunggah...' : 'Upload & Potong RAB'}
              </button>
            </div>
          </div>
        </div>
      )}
`;

page = page.replace(
  /\{showKopModal && \(/,
  modalCode + '\n      {showKopModal && ('
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', page);
console.log('Fixed client-page for upload modal');
