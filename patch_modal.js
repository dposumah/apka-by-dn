const fs = require('fs');

let content = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf-8');

const oldModal = `{/* Modal Pilih Dokumen */}
        {showKopModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              {!kwitansiInputStep ? (
                <>
                  <h3 className="text-lg font-bold mb-4">Pilih Jenis Dokumen untuk Dicetak</h3>
                  <p className="text-sm text-slate-600 mb-6">Pilih apakah Anda ingin mencetak dokumen berupa Invoice (Standar) atau Kwitansi (Format Yayasan Maleo).</p>
                  <div className="flex flex-col space-y-3">
                    <button 
                      onClick={() => handlePrintWithKop('invoice_maleo')}
                      className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors text-left flex justify-between items-center"
                    >
                      <span>Cetak Invoice Honorarium (Kop Yayasan Maleo)</span>
                    </button>
                    <button 
                      onClick={() => handlePrintWithKop('invoice_robotic')}
                      className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors text-left flex justify-between items-center"
                    >
                      <span>Cetak Invoice Honorarium (Kop Robotic Explorer)</span>
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

const newModal = `{/* Modal Pilih Dokumen */}
        {showKopModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[450px]">
              <h3 className="text-lg font-bold mb-4">Export Dokumen (PDF)</h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border rounded-md space-y-2">
                  <label className="font-semibold block">Dokumen yang akan digenerate:</label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={printCheckInvoice} onChange={e => setPrintCheckInvoice(e.target.checked)} className="w-4 h-4 text-blue-600" />
                    <span>Invoice Honorarium</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={printCheckHonor} onChange={e => setPrintCheckHonor(e.target.checked)} className="w-4 h-4 text-blue-600" />
                    <span>Kwitansi Honorarium</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={printCheckTransport} onChange={e => setPrintCheckTransport(e.target.checked)} className="w-4 h-4 text-blue-600" />
                    <span>Kwitansi Transport (Bulanan)</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold block">Pilih Kop Surat (Khusus Invoice):</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="kopType" checked={printKopType === 'maleo'} onChange={() => setPrintKopType('maleo')} className="w-4 h-4 text-blue-600" />
                      <span>Yayasan Maleo</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="kopType" checked={printKopType === 'robotic'} onChange={() => setPrintKopType('robotic')} className="w-4 h-4 text-blue-600" />
                      <span>Robotic Explorer</span>
                    </label>
                  </div>
                </div>

                {(printCheckHonor || printCheckTransport) && (
                  <div className="space-y-3 pt-3 border-t">
                    <label className="font-semibold block text-blue-800">Detail Kwitansi</label>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nomor Urut Kwitansi <span className="text-slate-500 font-normal">(Kosongkan untuk nomor otomatis)</span></label>
                      <input 
                        type="text" 
                        value={inputNoUrut}
                        onChange={(e) => setInputNoUrut(e.target.value)}
                        placeholder="Contoh: 001, 002..."
                        className="w-full border rounded p-2"
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
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={() => setShowKopModal(false)} 
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                  disabled={isGeneratingPdf}
                >
                  Batal
                </button>
                <button 
                  onClick={generatePdfDirect}
                  disabled={isGeneratingPdf || (!printCheckInvoice && !printCheckHonor && !printCheckTransport)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGeneratingPdf ? 'Memproses...' : 'Export to PDF'}
                </button>
              </div>
            </div>
          </div>
        )}`;

content = content.replace(oldModal, newModal);
fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', content);
