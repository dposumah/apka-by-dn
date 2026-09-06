const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/client-page.tsx', 'utf8')

const target = `<div className="text-right">
                    {lap.expenseRequest ? (
                      <>
                        <div className="font-medium text-slate-900">Rp {lap.expenseRequest.amount.toLocaleString('id-ID')}</div>
                        <div className="text-xs mt-1 px-2 py-1 bg-slate-100 rounded-md inline-block">
                          {lap.expenseRequest.status === 'APPROVED' ? (
                            <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Disetujui</span>
                          ) : lap.expenseRequest.status === 'REJECTED' ? (
                            <span className="text-red-600">Ditolak</span>
                          ) : (
                            <span className="text-amber-600">Menunggu</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Belum ada tagihan</span>
                    )}
                  </div>`

const replacement = `<div className="text-right space-y-1">
                    <div className="text-sm font-medium text-slate-900">{lap.jumlahJP} JP <span className="text-slate-500 font-normal">({lap.tingkatSekolah} - {lap.jenisKegiatan})</span></div>
                    {lap.biayaTransport > 0 && (
                      <div className="text-xs text-blue-600">Transport: Rp {lap.biayaTransport.toLocaleString('id-ID')} ({lap.statusTransport})</div>
                    )}
                    {lap.rekapHonorariumId ? (
                      <div className="text-xs text-emerald-600 mt-1 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3"/> Direkap</div>
                    ) : (
                      <div className="text-xs text-amber-600 mt-1">Belum direkap</div>
                    )}
                  </div>`

code = code.replace(target, replacement)
fs.writeFileSync('src/app/(snt)/portal/client-page.tsx', code)

// Fix page.tsx query too
let page = fs.readFileSync('src/app/(snt)/portal/page.tsx', 'utf8')
page = page.replace(/include:\s*\{\n\s*expenseRequest:\s*true\n\s*\}/g, "")
fs.writeFileSync('src/app/(snt)/portal/page.tsx', page)
