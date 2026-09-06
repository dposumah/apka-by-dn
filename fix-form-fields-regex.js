const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/form.tsx', 'utf8')

// Replace using single-line regex to avoid \r\n issues
code = code.replace(
  /<Textarea name="alamat" defaultValue=\{initialData\?\.alamat \|\| ''\} \/>/g,
  `<Textarea name="alamat" defaultValue={initialData?.alamat || ''} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="space-y-2">
                <Label>Provinsi</Label>
                <Input name="propinsi" defaultValue={initialData?.propinsi || ''} />
              </div>
              <div className="space-y-2">
                <Label>Kabupaten / Kota</Label>
                <Input name="kabKota" defaultValue={initialData?.kabKota || ''} />
              </div>`
)

fs.writeFileSync('src/app/(snt)/fasilitator/form.tsx', code)
