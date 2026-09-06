const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/form.tsx', 'utf8')

// We need to inject the inputs for propinsi and kabKota
// They can go right after alamat. Let's find Alamat.
const targetAlamat = `          <div className="space-y-2 col-span-2">
            <Label htmlFor="alamat">Alamat / Domisili</Label>
            <Textarea id="alamat" name="alamat" defaultValue={initialData?.alamat} />
          </div>`

const replacementAlamat = `          <div className="space-y-2 col-span-2">
            <Label htmlFor="alamat">Alamat Lengkap</Label>
            <Textarea id="alamat" name="alamat" defaultValue={initialData?.alamat} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="propinsi">Provinsi</Label>
            <Input id="propinsi" name="propinsi" defaultValue={initialData?.propinsi} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kabKota">Kabupaten / Kota</Label>
            <Input id="kabKota" name="kabKota" defaultValue={initialData?.kabKota} />
          </div>`

code = code.replace(targetAlamat, replacementAlamat)

fs.writeFileSync('src/app/(snt)/fasilitator/form.tsx', code)
