const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/form.tsx', 'utf8')

const regex = /<div className="space-y-2">\s*<Label>Email<\/Label>\s*<Input name="email" type="email" defaultValue=\{initialData\?\.email \|\| ''\} \/>\s*<\/div>\s*<\/div>/g

const replacement = `<div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={initialData?.email || ''} />
            </div>
          </div>
          
          <div className="space-y-2 mt-4 pt-4 border-t">
            <Label>Besaran Transport Darat (Rp) *</Label>
            <Input name="besaranTransport" type="number" defaultValue={initialData?.besaranTransport ?? 120000} required />
            <p className="text-xs text-slate-500">Angka ini akan otomatis mengisi transport pada laporan mingguan fasilitator.</p>
          </div>`

code = code.replace(regex, replacement)

fs.writeFileSync('src/app/(snt)/fasilitator/form.tsx', code)
