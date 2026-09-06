const fs = require('fs')
let code = fs.readFileSync('src/app/(snt)/fasilitator/[id]/page.tsx', 'utf8')

const target = `<CardTitle>Riwayat Pembayaran Honorarium</CardTitle>`

const replacement = `<CardTitle>Riwayat Laporan Mingguan</CardTitle>
            </CardHeader>
            <CardContent>
              {f.laporan && f.laporan.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Topik / Kegiatan</th>
                        <th className="py-2 px-3 text-center">Tingkat</th>
                        <th className="py-2 px-3 text-center">Peserta</th>
                        <th className="py-2 px-3 text-center">JP</th>
                        <th className="py-2 px-3 text-right">Transport</th>
                        <th className="py-2 px-3 text-center">Lampiran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.laporan.map((lap: any) => (
                        <tr key={lap.id} className="border-b">
                          <td className="py-2 px-3 whitespace-nowrap">{new Date(lap.date).toLocaleDateString('id-ID')}</td>
                          <td className="py-2 px-3">
                            {lap.topic}
                            <div className="text-xs text-slate-500">{lap.jenisKegiatan}</div>
                          </td>
                          <td className="py-2 px-3 text-center">{lap.tingkatSekolah}</td>
                          <td className="py-2 px-3 text-center">{lap.attendance}</td>
                          <td className="py-2 px-3 text-center font-medium">{lap.jumlahJP}</td>
                          <td className="py-2 px-3 text-right">
                            {lap.biayaTransport > 0 ? (
                              <>
                                <div>{formatCurrency(lap.biayaTransport)}</div>
                                <div className={\`text-[10px] font-bold \${lap.statusTransport === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}\`}>
                                  {lap.statusTransport === 'PAID' ? 'LUNAS' : 'PENDING'}
                                </div>
                              </>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex flex-col gap-1 items-center">
                              {lap.foto1 ? <a href={lap.foto1} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">Foto 1</a> : '-'}
                              {lap.foto2 && <a href={lap.foto2} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">Foto 2</a>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500">Belum ada laporan mingguan.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pembayaran Honorarium</CardTitle>`

code = code.replace(target, replacement)
fs.writeFileSync('src/app/(snt)/fasilitator/[id]/page.tsx', code)
