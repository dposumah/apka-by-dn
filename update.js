const fs = require('fs')

let text = fs.readFileSync('src/app/(snt)/fasilitator/[id]/page.tsx', 'utf8')
const target = <div>
                <span className="text-slate-500 block">NIP / NUPTK</span>
                <span className="font-medium">{f.nipNuptk || '-'}</span>
              </div>
              
const replacement = <div>
                <span className="text-slate-500 block">NIP / NUPTK</span>
                <span className="font-medium">{f.nipNuptk || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Kepegawaian</span>
                <span className="font-medium">
                  {f.statusKepegawaian || 'Non-ASN'} 
                  {f.statusKepegawaian === 'ASN' && f.pangkatGolongan && \ (\)\}
                </span>
              </div>

text = text.replace(target, replacement)
fs.writeFileSync('src/app/(snt)/fasilitator/[id]/page.tsx', text)
