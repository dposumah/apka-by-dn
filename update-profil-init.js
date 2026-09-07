const fs = require('fs')

let path = 'src/app/(snt)/portal/profil/client-profil.tsx'
let code = fs.readFileSync(path, 'utf8')

const targetInit = `  const [formData, setFormData] = useState({
    namaLengkap: fasilitator.namaLengkap || '',
    nipNuptk: fasilitator.nipNuptk || '',
    nidn: fasilitator.nidn || '',
    instansi: fasilitator.instansi || '',
    email: fasilitator.email || '',
    kontak: fasilitator.kontak || '',
    bankName: fasilitator.bankName || '',
    bankAccount: fasilitator.bankAccount || '',
    npwpNik: fasilitator.npwpNik || '',
    statusKepegawaian: fasilitator.statusKepegawaian || 'Non-ASN',
    pangkatGolongan: fasilitator.pangkatGolongan || '',
    alamat: fasilitator.alamat || '',
    kabKota: fasilitator.kabKota || '',
    propinsi: fasilitator.propinsi || '',
    lokasiSNT: fasilitator.lokasiSNT || '',
  })`

const replacementInit = `  const [formData, setFormData] = useState({
    namaLengkap: fasilitator.namaLengkap || '',
    nipNuptk: fasilitator.nipNuptk || '',
    nidn: fasilitator.nidn || '',
    instansi: fasilitator.instansi || '',
    jabatan: fasilitator.jabatan || '',
    pendidikan: fasilitator.pendidikan || '',
    klusterKeahlian: fasilitator.klusterKeahlian || '',
    mataPelajaran: fasilitator.mataPelajaran || '',
    kompetensi: fasilitator.kompetensi || '',
    sertifikasi: fasilitator.sertifikasi || '',
    email: fasilitator.email || '',
    kontak: fasilitator.kontak || '',
    bankName: fasilitator.bankName || '',
    bankAccount: fasilitator.bankAccount || '',
    npwpNik: fasilitator.npwpNik || '',
    statusKepegawaian: fasilitator.statusKepegawaian || 'Non-ASN',
    pangkatGolongan: fasilitator.pangkatGolongan || '',
    alamat: fasilitator.alamat || '',
    kabKota: fasilitator.kabKota || '',
    propinsi: fasilitator.propinsi || '',
    lokasiSNT: fasilitator.lokasiSNT || '',
  })`

code = code.replace(targetInit, replacementInit)
fs.writeFileSync(path, code)
