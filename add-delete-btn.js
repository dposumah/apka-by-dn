const fs = require('fs')
let code = fs.readFileSync('src/app/(snt)/portal/client-page.tsx', 'utf8')

const targetDiv = `{lap.rekapHonorariumId ? (
                      <div className="text-xs text-emerald-600 mt-1 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3"/> Direkap (Bulanan)</div>
                    ) : (
                      <div className="text-xs text-amber-600 mt-1 flex justify-end">Honor Belum direkap</div>
                    )}`

const replacementDiv = `{lap.rekapHonorariumId ? (
                      <div className="text-xs text-emerald-600 mt-1 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3"/> Direkap (Bulanan)</div>
                    ) : (
                      <div className="text-xs text-amber-600 mt-1 flex justify-end">Honor Belum direkap</div>
                    )}
                    
                    {!lap.rekapHonorariumId && lap.statusTransport !== 'PAID' && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleDeleteLaporan(lap.id)}
                          disabled={deletingId === lap.id}
                          className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline disabled:opacity-50"
                        >
                          {deletingId === lap.id ? 'Membatalkan...' : 'Batalkan Laporan'}
                        </button>
                      </div>
                    )}`

code = code.replace(targetDiv, replacementDiv)
fs.writeFileSync('src/app/(snt)/portal/client-page.tsx', code)
