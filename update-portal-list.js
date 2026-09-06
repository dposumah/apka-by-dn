const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/client-page.tsx', 'utf8')

const target = `<div className="text-sm font-medium text-slate-900">{lap.jumlahJP} JP <span className="text-slate-500 font-normal">({lap.tingkatSekolah} - {lap.jenisKegiatan})</span></div>`

const replacement = `<div className="text-sm font-medium text-slate-900">
                      {(lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0)} JP 
                      <span className="text-slate-500 font-normal ml-1">
                        ({lap.tingkatSekolah} - Intra: {lap.jumlahJPIntra}, Ekstra: {lap.jumlahJPEkstra})
                      </span>
                    </div>`

code = code.replace(target, replacement)
fs.writeFileSync('src/app/(snt)/portal/client-page.tsx', code)
