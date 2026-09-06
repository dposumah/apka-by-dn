const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/client-page.tsx', 'utf8')

const target = `<div className="text-right space-y-1">
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

const replacement = `<div className="text-right space-y-1">
                    <div className="text-sm font-medium text-slate-900">{lap.jumlahJP} JP <span className="text-slate-500 font-normal">({lap.tingkatSekolah} - {lap.jenisKegiatan})</span></div>
                    {lap.biayaTransport > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Transport: Rp {lap.biayaTransport.toLocaleString('id-ID')}
                        {lap.statusTransport === 'PAID' && lap.buktiTransferTransport ? (
                          <a href={lap.buktiTransferTransport} target="_blank" rel="noreferrer" className="ml-1 text-emerald-600 font-medium hover:underline flex justify-end items-center mt-1">
                            Lunas (Lihat Bukti)
                          </a>
                        ) : lap.statusTransport === 'PAID' ? (
                          <span className="ml-1 text-emerald-600 font-medium block mt-1">Lunas</span>
                        ) : (
                          <span className="ml-1 text-amber-600 block mt-1">Menunggu Transfer Admin</span>
                        )}
                      </div>
                    )}
                    {lap.rekapHonorariumId ? (
                      <div className="text-xs text-emerald-600 mt-1 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3"/> Direkap (Bulanan)</div>
                    ) : (
                      <div className="text-xs text-amber-600 mt-1 flex justify-end">Honor Belum direkap</div>
                    )}
                  </div>`

code = code.replace(target, replacement)
fs.writeFileSync('src/app/(snt)/portal/client-page.tsx', code)
