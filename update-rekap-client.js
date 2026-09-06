const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/rekap/client-page.tsx', 'utf8')

const target = `{rekap.status === 'SUBMITTED' && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Sudah Diajukan
                        </span>
                        {rekap.filePdf && (
                          <div className="mt-1">
                            <a href={rekap.filePdf} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                              Lihat Dokumen TTD
                            </a>
                          </div>
                        )}
                      </div>
                    )}`

const replacement = `{rekap.status === 'SUBMITTED' && (
                      <div className="text-right">
                        {rekap.expense?.status === 'APPROVED' ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Lunas / Selesai
                            </span>
                            {rekap.expense.paymentReceiptUrl && (
                              <div className="mt-1">
                                <a href={rekap.expense.paymentReceiptUrl} target="_blank" rel="noreferrer" className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100 inline-block">
                                  Lihat Bukti Transfer
                                </a>
                              </div>
                            )}
                          </>
                        ) : rekap.expense?.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                            Ditolak Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
                            Sedang Diproses Keuangan
                          </span>
                        )}
                        
                        {rekap.filePdf && (
                          <div className="mt-2">
                            <a href={rekap.filePdf} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                              Lihat Dokumen TTD yang Diajukan
                            </a>
                          </div>
                        )}
                      </div>
                    )}`

code = code.replace(target, replacement)
fs.writeFileSync('src/app/(snt)/portal/rekap/client-page.tsx', code)
