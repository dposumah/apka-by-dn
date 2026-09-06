const fs = require('fs')
let code = fs.readFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', 'utf8')

// Fix table body in admin list
const listTopicTarget = `{lap.topic}
                      <div className="text-xs text-slate-500">{lap.jenisKegiatan} &bull; {lap.attendance} Peserta</div>`
const listTopicReplace = `{lap.topic}
                      <div className="text-xs text-slate-500">{lap.attendance} Peserta</div>`
code = code.replace(listTopicTarget, listTopicReplace)

const listJPTarget = `<td className="py-3 px-4 text-center font-medium">{lap.jumlahJP}</td>`
const listJPReplace = `<td className="py-3 px-4 text-center text-sm">
                      <div>Intra: <strong>{lap.jumlahJPIntra}</strong></div>
                      <div>Ekstra: <strong>{lap.jumlahJPEkstra}</strong></div>
                    </td>`
code = code.replace(listJPTarget, listJPReplace)

// Fix Invoice Print
const invTopicTarget = `<td>Transport Darat (Default)</td>
                  <td>\${lap.topic} - \${lap.jenisKegiatan}</td>
                  <td>Rp \${lap.biayaTransport.toLocaleString('id-ID')}</td>`
const invTopicReplace = `<td>Transport Darat (Default)</td>
                  <td>\${lap.topic} - (Intra: \${lap.jumlahJPIntra}, Ekstra: \${lap.jumlahJPEkstra})</td>
                  <td>Rp \${lap.biayaTransport.toLocaleString('id-ID')}</td>`
code = code.replace(invTopicTarget, invTopicReplace)

fs.writeFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', code)
