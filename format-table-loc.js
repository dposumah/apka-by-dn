const fs = require('fs')

function splitLokasiSNT(filePath) {
  let code = fs.readFileSync(filePath, 'utf8')
  // We look for {f.lokasiSNT || '-'} and replace it. Or {lap.fasilitator.lokasiSNT || '-'}
  
  if (code.includes('{f.lokasiSNT || \'-\'}')) {
    code = code.replace(
      '<td className="px-4 py-3 text-slate-600">{f.lokasiSNT || \'-\'}</td>',
      `<td className="px-4 py-3 text-slate-600">
        {f.lokasiSNT ? (
          <>
            <div className="font-medium text-slate-800">{f.lokasiSNT.split(' - ')[0]}</div>
            {f.lokasiSNT.split(' - ')[1] && <div className="text-xs text-slate-500 mt-0.5 leading-tight">{f.lokasiSNT.split(' - ')[1]}</div>}
          </>
        ) : (
          '-'
        )}
      </td>`
    )
  }

  if (code.includes('{lap.fasilitator.lokasiSNT || \'-\'}')) {
    code = code.replace(
      '<td className="px-4 py-3">{lap.fasilitator.lokasiSNT || \'-\'}</td>',
      `<td className="px-4 py-3">
        {lap.fasilitator.lokasiSNT ? (
          <>
            <div className="font-medium text-slate-800">{lap.fasilitator.lokasiSNT.split(' - ')[0]}</div>
            {lap.fasilitator.lokasiSNT.split(' - ')[1] && <div className="text-xs text-slate-500 mt-0.5 leading-tight">{lap.fasilitator.lokasiSNT.split(' - ')[1]}</div>}
          </>
        ) : (
          '-'
        )}
      </td>`
    )
  }

  fs.writeFileSync(filePath, code)
}

splitLokasiSNT('src/app/(snt)/fasilitator/page.tsx')
splitLokasiSNT('src/app/(snt)/fasilitator/transport/client-page.tsx')
