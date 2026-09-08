"use client"

import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'

export function ExportExcelButton({ data }: { data: any[] }) {
  const handleExport = () => {
    // Format data for excel
    const formattedData = data.map((f, index) => ({
      'No': index + 1,
      'Nama Lengkap': f.namaLengkap || '-',
      'Instansi': f.instansi || '-',
      'Jabatan': f.jabatan || '-',
      'NIP/NUPTK': f.nipNuptk || '-',
      'NIDN': f.nidn || '-',
      'Status Kepegawaian': f.statusKepegawaian || '-',
      'Pangkat/Golongan': f.pangkatGolongan || '-',
      'Pendidikan Terakhir': f.pendidikan || '-',
      'Kluster Keahlian': f.klusterKeahlian || '-',
      'Mata Pelajaran': f.mataPelajaran || '-',
      'Kompetensi': f.kompetensi || '-',
      'Sertifikasi': f.sertifikasi || '-',
      'Lokasi SNT': f.lokasiSNT || '-',
      'Provinsi': f.propinsi || '-',
      'Kabupaten/Kota': f.kabKota || '-',
      'Alamat/Domisili': f.alamat || '-',
      'Email': f.email || '-',
      'No Kontak': f.kontak || '-',
      'Nama Bank': f.bankName || '-',
      'No Rekening': f.bankAccount || '-',
      'NPWP/NIK': f.npwpNik || '-',
      'Status Akun': f.isActive ? 'Aktif' : 'Non-Aktif'
    }))

    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Fasilitator")

    // Adjust column widths
    const maxWidths = Object.keys(formattedData[0] || {}).map(() => ({ wch: 20 }))
    worksheet['!cols'] = maxWidths

    XLSX.writeFile(workbook, `Data_Fasilitator_SNT_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <button 
      onClick={handleExport}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 h-10 py-2 px-4 shadow-sm"
    >
      <Download className="w-4 h-4 mr-2" />
      Export Excel
    </button>
  )
}
