const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/[id]/page.tsx', 'utf8')

const targetAlamatArea = `<div className="col-span-2">
                <span className="text-slate-500 block">Bidang Keahlian / Kompetensi</span>`

const replacementAlamatArea = `<div className="col-span-2">
                <span className="text-slate-500 block">Alamat / Wilayah</span>
                <p className="font-medium mt-1">{f.alamat || '-'}</p>
                <p className="text-slate-600 mt-1">
                  {f.kabKota || ''} {f.propinsi ? \`- \${f.propinsi}\` : ''}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Bidang Keahlian / Kompetensi</span>`

code = code.replace(targetAlamatArea, replacementAlamatArea)

fs.writeFileSync('src/app/(snt)/fasilitator/[id]/page.tsx', code)
