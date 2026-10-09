const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// 1. Add State
const stateInjection = `const [inputTanggal, setInputTanggal] = useState("")

    const [showTextModal, setShowTextModal] = useState(false)
    const [textToCopy, setTextToCopy] = useState("")
  
    const handleCopyText = (rekap: any) => {
      const bankName = rekap.fasilitator?.bankName || '-';
      const bankAccount = rekap.fasilitator?.bankAccount || '-';
      const namaLengkap = rekap.fasilitator?.namaLengkap || '-';
      const lokasi = rekap.fasilitator?.lokasiSNT || '-';
      const jumlahJP = rekap.totalJP;
      // Using a simple local format since formatCurrency is imported
      let nominalStr = "Rp 0";
      if (rekap.totalHonor) {
        nominalStr = "Rp " + Math.round(rekap.totalHonor).toLocaleString('id-ID');
      }
      
      const text = \`Data Pembayaran Honor:
Nama Fasilitator: \${namaLengkap}
Lokasi (SNT): \${lokasi}
Bulan Laporan: \${rekap.bulan}
Jumlah JP: \${jumlahJP} JP
Total Pembayaran: \${nominalStr}

Informasi Rekening:
Bank: \${bankName}
No. Rekening: \${bankAccount}
Atas Nama: \${namaLengkap}\`;
      
      setTextToCopy(text);
      setShowTextModal(true);
    }
`;

file = file.replace(/const \[inputTanggal, setInputTanggal\] = useState\(""\)/, stateInjection);

// 2. Add Button to Aksi Column
const buttonInjection = `<button onClick={() => handleCopyText(rekap)} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap" title="Salin detail pembayaran">Salin Data</button>
                            <button onClick={() => handleDelete(rekap.id)}`;

file = file.replace(/<button onClick=\{\(\) => handleDelete\(rekap\.id\)\}/, buttonInjection);

// 3. Add Modal Block
const modalInjection = `      {showTextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[450px]">
              <h3 className="text-lg font-bold mb-4">Detail Data Pembayaran</h3>
              <p className="text-sm text-slate-500 mb-2">Teks berikut siap disalin atau dibagikan:</p>
              <textarea 
                readOnly 
                className="w-full h-48 p-3 text-sm font-mono border rounded-md bg-slate-50 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={textToCopy}
              />
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowTextModal(false)} 
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(textToCopy);
                    alert("Teks berhasil disalin ke clipboard!");
                  }} 
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Salin Teks
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
`;

file = file.replace(/<\/div>\s*\)\s*}\s*$/, modalInjection);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', file);
console.log("Client page updated again!");
