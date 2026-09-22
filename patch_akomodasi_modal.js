const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/akomodasi/client-page.tsx', 'utf8');

// Find the states
const stateIndex = code.indexOf('const [activeTab, setActiveTab] = useState<\'SEWA\' | \'TOT\'>(\'SEWA\')');
if (stateIndex !== -1) {
  const customModalCode = `
  // Custom Modal State for Kop Surat
  const [showKopModal, setShowKopModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const openKopModal = (item: any) => {
    setSelectedItem(item)
    setShowKopModal(true)
  }

  const handlePrintWithKop = (kopType: 'robotik' | 'maleo') => {
    setShowKopModal(false)
    if (selectedItem) {
      if (selectedItem.tipe === 'SEWA_RUMAH') {
        cetakInvoiceSewa(selectedItem, kopType)
      } else {
        cetakInvoiceToT(selectedItem, kopType)
      }
    }
  }

  const [activeTab, setActiveTab] = useState<'SEWA' | 'TOT'>('SEWA')
`;
  code = code.substring(0, stateIndex) + customModalCode + code.substring(stateIndex + 68);
}

// Modify cetakInvoiceSewa to accept kopType
code = code.replace(
  "const cetakInvoiceSewa = (item: any) => {",
  "const cetakInvoiceSewa = (item: any, kopType: 'robotik' | 'maleo') => {"
);
code = code.replace(
  '<img src="/kop-surat.png" class="header-img" />',
  '<img src="${kopType === \'maleo\' ? \'/kop-maleo.png\' : \'/kop-surat.png\'}" class="header-img" />'
);

// Modify cetakInvoiceToT to accept kopType
code = code.replace(
  "const cetakInvoiceToT = (item: any) => {",
  "const cetakInvoiceToT = (item: any, kopType: 'robotik' | 'maleo') => {"
);
code = code.replace(
  '<img src="/kop-surat.png" class="header-img" />',
  '<img src="${kopType === \'maleo\' ? \'/kop-maleo.png\' : \'/kop-surat.png\'}" class="header-img" />'
);

// Modify the print button
code = code.replace(
  "onClick={() => item.tipe === 'SEWA_RUMAH' ? cetakInvoiceSewa(item) : cetakInvoiceToT(item)}",
  "onClick={() => openKopModal(item)}"
);

// Inject the JSX for the custom modal before the final </div>
const modalJsx = `
      {/* Modal Pilih Kop Surat */}
      {showKopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Pilih Kop Surat Kwitansi</h3>
            <p className="text-sm text-slate-600 mb-6">Pilih jenis kop surat yang akan digunakan untuk mencetak kwitansi ini.</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => handlePrintWithKop('robotik')}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Gunakan Kop Robotik (Standar)</span>
              </button>
              <button 
                onClick={() => handlePrintWithKop('maleo')}
                className="w-full py-2 px-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Gunakan Kop Yayasan Maleo</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowKopModal(false)} className="text-sm text-slate-500 hover:text-slate-800">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
`;

code = code.replace(/<\/div>\s*\)\s*}\s*$/, modalJsx);

fs.writeFileSync('src/app/(snt)/fasilitator/akomodasi/client-page.tsx', code);
console.log('Akomodasi page updated');
