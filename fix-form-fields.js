const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/form.tsx', 'utf8')

const targetAlamat = `            <div className="space-y-2">
              <Label>Alamat / Domisili</Label>
              <Textarea name="alamat" defaultValue={initialData?.alamat || ''} />
            </div>`

const replacementAlamat = `            <div className="space-y-2">
              <Label>Alamat / Domisili</Label>
              <Textarea name="alamat" defaultValue={initialData?.alamat || ''} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Provinsi</Label>
                <Input name="propinsi" defaultValue={initialData?.propinsi || ''} />
              </div>
              <div className="space-y-2">
                <Label>Kabupaten / Kota</Label>
                <Input name="kabKota" defaultValue={initialData?.kabKota || ''} />
              </div>
            </div>`

code = code.replace(targetAlamat, replacementAlamat)

fs.writeFileSync('src/app/(snt)/fasilitator/form.tsx', code)
