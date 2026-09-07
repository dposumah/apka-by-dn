const fs = require('fs')

let path = 'src/app/(snt)/portal/rekap/[id]/pdf/page.tsx'
let code = fs.readFileSync(path, 'utf8')

code = code.replace(
  '<td className="border border-black px-3 py-2">{lap.topic} <span className="text-xs text-gray-500 block">({lap.jenisKegiatan})</span></td>',
  '<td className="border border-black px-3 py-2">{lap.topic}</td>'
)

code = code.replace(
  '<td className="border border-black px-3 py-2 text-center">{lap.jumlahJP}</td>',
  '<td className="border border-black px-3 py-2 text-center">{(lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0)}</td>'
)

fs.writeFileSync(path, code)
