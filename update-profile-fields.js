const fs = require('fs')
let path = 'src/app/(snt)/portal/profil/client-profil.tsx'
let code = fs.readFileSync(path, 'utf8')

const targetForm = `<div className="space-y-2">
                <Label>NIDN</Label>
                <Input value={formData.nidn} onChange={e => setFormData({...formData, nidn: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Instansi</Label>
                <Input value={formData.instansi} onChange={e => setFormData({...formData, instansi: e.target.value})} />
              </div>`

const replacementForm = `<div className="space-y-2">
                <Label>NIDN</Label>
                <Input value={formData.nidn} onChange={e => setFormData({...formData, nidn: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Instansi</Label>
                <Input value={formData.instansi} onChange={e => setFormData({...formData, instansi: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jabatan</Label>
                  <Input value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Pendidikan Terakhir</Label>
                  <Input value={formData.pendidikan} onChange={e => setFormData({...formData, pendidikan: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kluster Keahlian</Label>
                  <Input value={formData.klusterKeahlian} onChange={e => setFormData({...formData, klusterKeahlian: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Mata Pelajaran</Label>
                  <Input value={formData.mataPelajaran} onChange={e => setFormData({...formData, mataPelajaran: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kompetensi</Label>
                  <Input value={formData.kompetensi} onChange={e => setFormData({...formData, kompetensi: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Sertifikasi</Label>
                  <Input value={formData.sertifikasi} onChange={e => setFormData({...formData, sertifikasi: e.target.value})} />
                </div>
              </div>`

code = code.replace(targetForm, replacementForm)

const targetView = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Nama Lengkap</p>
                  <p className="font-medium text-lg">{fasilitator.namaLengkap}</p>
                </div>
                <div>
                  <p className="text-slate-500">Instansi</p>
                  <p className="font-medium text-lg">{fasilitator.instansi || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">NIP/NUPTK/NIDN</p>
                  <p className="font-medium">{fasilitator.nipNuptk || fasilitator.nidn || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status Kepegawaian</p>
                  <p className="font-medium">
                    {fasilitator.statusKepegawaian || 'Non-ASN'} 
                    {fasilitator.statusKepegawaian === 'ASN' && fasilitator.pangkatGolongan && \` (\${fasilitator.pangkatGolongan})\`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Email & Kontak</p>
                  <p className="font-medium">{fasilitator.email} <br/> {fasilitator.kontak}</p>
                </div>
                <div>
                  <p className="text-slate-500">Lokasi SNT</p>
                  {fasilitator.lokasiSNT ? (
    <>
      <p className="font-medium">{fasilitator.lokasiSNT.split(' - ')[0]}</p>
      {fasilitator.lokasiSNT.split(' - ')[1] && <p className="text-slate-600 text-xs mt-0.5 leading-tight">{fasilitator.lokasiSNT.split(' - ')[1]}</p>}
    </>
  ) : (
    <p className="font-medium">-</p>
  )}
                </div>
                <div>
                  <p className="text-slate-500">Alamat / Domisili</p>
                  <p className="font-medium">{fasilitator.alamat || '-'}</p>
                  <p className="text-slate-600 text-xs">
                    {fasilitator.kabKota || ''} {fasilitator.propinsi ? \`- \${fasilitator.propinsi}\` : ''}
                  </p>
                </div>
              </div>`

const replacementView = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Nama Lengkap</p>
                  <p className="font-medium text-lg">{fasilitator.namaLengkap}</p>
                </div>
                <div>
                  <p className="text-slate-500">Lokasi SNT</p>
                  {fasilitator.lokasiSNT ? (
                    <p className="font-medium text-lg text-blue-700">{fasilitator.lokasiSNT.split(' - ')[0]}</p>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                {fasilitator.instansi && (
                  <div>
                    <p className="text-slate-500">Instansi</p>
                    <p className="font-medium">{fasilitator.instansi}</p>
                  </div>
                )}
                {fasilitator.jabatan && (
                  <div>
                    <p className="text-slate-500">Jabatan</p>
                    <p className="font-medium">{fasilitator.jabatan}</p>
                  </div>
                )}
                {(fasilitator.nipNuptk || fasilitator.nidn) && (
                  <div>
                    <p className="text-slate-500">NIP/NUPTK/NIDN</p>
                    <p className="font-medium">{fasilitator.nipNuptk || fasilitator.nidn}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Status Kepegawaian</p>
                  <p className="font-medium">
                    {fasilitator.statusKepegawaian || 'Non-ASN'} 
                    {fasilitator.statusKepegawaian === 'ASN' && fasilitator.pangkatGolongan && \` (\${fasilitator.pangkatGolongan})\`}
                  </p>
                </div>
                {fasilitator.pendidikan && (
                  <div>
                    <p className="text-slate-500">Pendidikan</p>
                    <p className="font-medium">{fasilitator.pendidikan}</p>
                  </div>
                )}
                {fasilitator.klusterKeahlian && (
                  <div>
                    <p className="text-slate-500">Kluster Keahlian</p>
                    <p className="font-medium">{fasilitator.klusterKeahlian}</p>
                  </div>
                )}
                {fasilitator.mataPelajaran && (
                  <div>
                    <p className="text-slate-500">Mata Pelajaran</p>
                    <p className="font-medium">{fasilitator.mataPelajaran}</p>
                  </div>
                )}
                {fasilitator.kompetensi && (
                  <div>
                    <p className="text-slate-500">Kompetensi</p>
                    <p className="font-medium">{fasilitator.kompetensi}</p>
                  </div>
                )}
                {fasilitator.sertifikasi && (
                  <div>
                    <p className="text-slate-500">Sertifikasi</p>
                    <p className="font-medium">{fasilitator.sertifikasi}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Email & Kontak</p>
                  <p className="font-medium">{fasilitator.email} <br/> {fasilitator.kontak}</p>
                </div>
                <div>
                  <p className="text-slate-500">Alamat / Domisili</p>
                  <p className="font-medium">{fasilitator.alamat || '-'}</p>
                  <p className="text-slate-600 text-xs">
                    {fasilitator.kabKota || ''} {fasilitator.propinsi ? \`- \${fasilitator.propinsi}\` : ''}
                  </p>
                </div>
              </div>`

code = code.replace(targetView, replacementView)
fs.writeFileSync(path, code)
