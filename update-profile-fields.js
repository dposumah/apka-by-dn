const fs = require('fs')

const filePath = 'src/app/(snt)/fasilitator/[id]/page.tsx'
let code = fs.readFileSync(filePath, 'utf8')

// The block to replace:
const targetBlock = `              <div>
                <span className="text-slate-500 block">Pendidikan</span>
                <span className="font-medium">{f.pendidikan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kontak / HP</span>
                <span className="font-medium">{f.kontak || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email</span>
                <span className="font-medium">{f.email || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Bidang Keahlian / Kompetensi</span>
                <p className="font-medium mt-1">{f.klusterKeahlian}</p>
                <p className="text-slate-600 mt-1">{f.kompetensi}</p>
              </div>`

const replacementBlock = `              <div>
                <span className="text-slate-500 block">Jabatan Akademik / Fungsional</span>
                <span className="font-medium">{f.jabatan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">NIDN</span>
                <span className="font-medium">{f.nidn || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pendidikan</span>
                <span className="font-medium">{f.pendidikan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kontak / HP</span>
                <span className="font-medium">{f.kontak || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email</span>
                <span className="font-medium">{f.email || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sertifikasi</span>
                <span className="font-medium">{f.sertifikasi || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mata Pelajaran</span>
                <span className="font-medium">{f.mataPelajaran || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Lokasi SNT</span>
                <span className="font-medium">{f.lokasiSNT || '-'}</span>
              </div>
              
              <div className="col-span-2 border-t pt-4 mt-2">
                <span className="text-slate-500 block">Alamat / Wilayah</span>
                <p className="font-medium mt-1">{f.alamat || '-'}</p>
                <p className="text-slate-600 text-xs mt-1">
                  {f.kabKota || ''} {f.propinsi ? \`- \${f.propinsi}\` : ''}
                </p>
              </div>
              
              <div className="col-span-2 border-t pt-4">
                <span className="text-slate-500 block">Bidang Keahlian / Kompetensi</span>
                <p className="font-medium mt-1">{f.klusterKeahlian}</p>
                <p className="text-slate-600 text-sm mt-1">{f.kompetensi}</p>
              </div>`

code = code.replace(targetBlock, replacementBlock)

fs.writeFileSync(filePath, code)
