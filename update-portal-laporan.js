const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/laporan/client-form.tsx', 'utf8')

// Replace initial state
const initialDataRegex = /tingkatSekolah: 'SMP',\s*jenisKegiatan: 'INTRAKURIKULER',\s*jumlahJP: '',/
code = code.replace(initialDataRegex, "tingkatSekolah: 'SMP',\n    jumlahJPIntra: '',\n    jumlahJPEkstra: '',")

// Remove Jenis Kegiatan HTML
const jenisKegiatanRegex = /<div className="space-y-2">\s*<Label>Jenis Kegiatan<\/Label>\s*<div className="flex gap-4 mt-2">\s*<label className="flex items-center gap-2">\s*<input type="radio" name="jenisKegiatan"[\s\S]*?Ekstrakurikuler\s*<\/label>\s*<\/div>\s*<\/div>/

code = code.replace(jenisKegiatanRegex, "")

// Replace JP Input
const jpRegex = /<div className="space-y-2">\s*<Label>Jumlah JP \(Jam Pelajaran\)<\/Label>\s*<Input type="number" min="0" value=\{formData\.jumlahJP\} onChange=\{e => setFormData\(\{\.\.\.formData, jumlahJP: e\.target\.value\}\)\} placeholder="Misal: 2" required \/>\s*<p className="text-xs text-slate-500">Rate Honor Rp 65\.000 \/ JP<\/p>\s*<\/div>/

const jpReplacement = `<div className="space-y-2">
                <Label>JP Intrakurikuler</Label>
                <Input type="number" min="0" value={formData.jumlahJPIntra} onChange={e => setFormData({...formData, jumlahJPIntra: e.target.value})} placeholder="0" />
                <p className="text-xs text-slate-500">Maksimal 8 JP / minggu / Lokasi</p>
              </div>
              <div className="space-y-2">
                <Label>JP Ekstrakurikuler</Label>
                <Input type="number" min="0" value={formData.jumlahJPEkstra} onChange={e => setFormData({...formData, jumlahJPEkstra: e.target.value})} placeholder="0" />
                <p className="text-xs text-slate-500">Maksimal 4 JP / minggu / Lokasi</p>
              </div>`
              
code = code.replace(jpRegex, jpReplacement)

// Update grid template for the section containing the new JP inputs
// The section has `<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">`
// Now it has 3 items: Intra, Ekstra, and Transport Laut. Let's make it grid-cols-3
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">',
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">'
)

// Fix transport laut onChange bug (I see it was setting biayaTransport instead of biayaTransportLaut)
code = code.replace(
  'onChange={e => setFormData({...formData, biayaTransport: e.target.value})}',
  'onChange={e => setFormData({...formData, biayaTransportLaut: e.target.value})}'
)

fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', code)
