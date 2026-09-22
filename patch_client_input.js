const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// 1. Add new state variables
const stateVars = `  const [showKopModal, setShowKopModal] = useState(false)
  const [selectedRekap, setSelectedRekap] = useState<any>(null)
  
  // New variables for Kwitansi manual input
  const [kwitansiInputStep, setKwitansiInputStep] = useState(false)
  const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputTanggal, setInputTanggal] = useState("")`;

code = code.replace("  const [showKopModal, setShowKopModal] = useState(false)\n  const [selectedRekap, setSelectedRekap] = useState<any>(null)", stateVars);

// 2. Change openKopModal to reset states
const newOpenKop = `  const openKopModal = (rekap: any) => {
    setSelectedRekap(rekap)
    setKwitansiInputStep(false)
    setInputNoUrut("")
    
    // Default tanggal to today
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    setInputTanggal(localISOTime)
    
    setShowKopModal(true)
  }`;
code = code.replace(/  const openKopModal = \([\s\S]*?\}\n/m, newOpenKop + '\n');


// 3. Update handlePrintWithKop to handle the step and pass params
const oldHandlePrint = `  const handlePrintWithKop = async (docType: 'invoice' | 'kwitansi') => {
    setShowKopModal(false)
    if (selectedRekap) {
      if (docType === 'invoice') {
        cetakInvoiceLama(selectedRekap);
      } else {
        await cetakKwitansiMaleo(selectedRekap);
      }
    }
  }`;

const newHandlePrint = `  const handlePrintWithKop = async (docType: 'invoice' | 'kwitansi') => {
    if (docType === 'invoice') {
      setShowKopModal(false)
      if (selectedRekap) {
        cetakInvoiceLama(selectedRekap);
      }
    } else {
      if (!kwitansiInputStep) {
        // Switch to input step instead of closing modal
        setKwitansiInputStep(true);
      } else {
        // Proceed to print
        setShowKopModal(false);
        if (selectedRekap) {
          await cetakKwitansiMaleo(selectedRekap, inputNoUrut, inputTanggal);
        }
      }
    }
  }`;
code = code.replace(/  const handlePrintWithKop = async \([\s\S]*?    \}\n  \}/m, newHandlePrint);

// 4. Update cetakKwitansiMaleo signature and generate call
code = code.replace(
  "const cetakKwitansiMaleo = async (rekap: any) => {",
  "const cetakKwitansiMaleo = async (rekap: any, noUrut: string, tanggal: string) => {"
);
code = code.replace(
  "const record = await generateKwitansiHonor(rekap.id);",
  "const record = await generateKwitansiHonor(rekap.id, noUrut, tanggal);"
);

// 5. Update the Modal JSX
const oldModal = `{showKopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Pilih Jenis Dokumen untuk Dicetak</h3>
            <p className="text-sm text-slate-600 mb-6">Pilih apakah Anda ingin mencetak dokumen berupa Invoice (Standar) atau Kwitansi (Format Yayasan Maleo).</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => handlePrintWithKop('invoice')}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Cetak Invoice Honorarium (Format Lama)</span>
              </button>
              <button 
                onClick={() => handlePrintWithKop('kwitansi')}
                className="w-full py-2 px-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Cetak Kwitansi (Format Yayasan Maleo)</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowKopModal(false)} className="text-sm text-slate-500 hover:text-slate-800">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}`;

const newModal = `{showKopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            {!kwitansiInputStep ? (
              <>
                <h3 className="text-lg font-bold mb-4">Pilih Jenis Dokumen untuk Dicetak</h3>
                <p className="text-sm text-slate-600 mb-6">Pilih apakah Anda ingin mencetak dokumen berupa Invoice (Standar) atau Kwitansi (Format Yayasan Maleo).</p>
                <div className="flex flex-col space-y-3">
                  <button 
                    onClick={() => handlePrintWithKop('invoice')}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors text-left flex justify-between items-center"
                  >
                    <span>Cetak Invoice Honorarium (Format Lama)</span>
                  </button>
                  <button 
                    onClick={() => handlePrintWithKop('kwitansi')}
                    className="w-full py-2 px-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium rounded-md transition-colors text-left flex justify-between items-center"
                  >
                    <span>Cetak Kwitansi (Format Yayasan Maleo)</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-4">Input Data Kwitansi</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nomor Urut Kwitansi</label>
                    <input 
                      type="text" 
                      value={inputNoUrut}
                      onChange={(e) => setInputNoUrut(e.target.value)}
                      placeholder="Contoh: 001, 002..."
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tanggal Kwitansi</label>
                    <input 
                      type="date" 
                      value={inputTanggal}
                      onChange={(e) => setInputTanggal(e.target.value)}
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                  <button 
                    onClick={() => handlePrintWithKop('kwitansi')}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors mt-2"
                  >
                    Cetak Sekarang
                  </button>
                </div>
              </>
            )}
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => {
                  if (kwitansiInputStep) setKwitansiInputStep(false);
                  else setShowKopModal(false);
                }} 
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                {kwitansiInputStep ? 'Kembali' : 'Batal'}
              </button>
            </div>
          </div>
        </div>
      )}`;

// We use replace with regex for the modal
code = code.replace(/\{showKopModal && \([\s\S]*?\}\)\}/m, newModal);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Updated UI for manual Kwitansi Input');
