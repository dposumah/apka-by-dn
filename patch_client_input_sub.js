const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

const startIndex = code.indexOf('{showKopModal && (');
const endIndexStr = '</div>\r\n        </div>\r\n      )}';
let endIndex = code.indexOf(endIndexStr, startIndex);

if (endIndex === -1) {
    // try LF
    endIndex = code.indexOf('</div>\n        </div>\n      )}', startIndex);
}

if (startIndex !== -1 && endIndex !== -1) {
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
    
    // adjust end index to include the closing brackets
    const finalEndIndex = endIndex + endIndexStr.length;
    code = code.substring(0, startIndex) + newModal + code.substring(finalEndIndex);
    fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
    console.log('Successfully replaced modal!');
} else {
    console.log('Could not find modal bounds');
    console.log('startIndex:', startIndex);
    console.log('endIndex:', endIndex);
}
