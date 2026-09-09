"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as xlsx from 'xlsx'
import axios from 'axios'
import { parse, addDays, nextDay, Day } from 'date-fns'
import { id } from 'date-fns/locale'

// Map day name to date-fns Day (0=Sun, 1=Mon, ..., 6=Sat)
const dayToNumber: Record<string, Day> = {
  'Minggu': 0,
  'Senin': 1,
  'Selasa': 2,
  'Rabu': 3,
  'Kamis': 4,
  'Jumat': 5,
  'Sabtu': 6
}

export async function syncFromGoogleSheets() {
  try {
    const url = 'https://docs.google.com/spreadsheets/d/1N0dPla0am47JCgCoB2l1XlNmLbR8vCUXr3N9V4Wvn5k/export?format=xlsx'
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const workbook = xlsx.read(response.data)
    
    let logs: string[] = []
    let sheetsToProcess = workbook.SheetNames.filter(n => n !== 'Petunjuk')
    
    // Get modules
    const modules = await prisma.modulPembelajaran.findMany({ orderBy: { urutan: 'asc' } })
    
    for (const sheetName of sheetsToProcess) {
      logs.push(`Memproses sheet: ${sheetName}`)
      const sheet = workbook.Sheets[sheetName]
      const data = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 })
      
      if (!data || data.length === 0) continue
      
      let lokasiSNT = sheetName // Default
      let fasilIntra = ''
      let fasilEkskul = ''
      
      // Parse header details
      for (let i = 0; i < 15; i++) {
        if (!data[i]) continue;
        const col0 = String(data[i][0] || '')
        const col1 = String(data[i][1] || '')
        
        if (col0.includes('Lokasi:')) lokasiSNT = col1.trim()
        if (col0.includes('Fasilitator Intrakurikuler:')) fasilIntra = col1.trim()
        if (col0.includes('Fasilitator Ekskul:')) fasilEkskul = col1.trim()
      }

      // Check and update Fasilitator
      const matchAndUpsertFasil = async (fasilStr: string) => {
          if (!fasilStr) return;
          const name = fasilStr.split(' (')[0].trim()
          if (!name) return;
          const exist = await prisma.fasilitator.findFirst({
              where: { namaLengkap: { contains: name, mode: 'insensitive' } }
          });
          if (exist) {
             if (exist.lokasiSNT !== lokasiSNT) {
                 await prisma.fasilitator.update({
                     where: { id: exist.id },
                     data: { lokasiSNT }
                 })
                 logs.push(`Lokasi Fasilitator ${name} diupdate menjadi ${lokasiSNT}`)
             }
          } else {
             await prisma.fasilitator.create({
                 data: { namaLengkap: name, lokasiSNT, tugas: 'KEDUANYA' }
             })
             logs.push(`Fasilitator baru ditambahkan: ${name}`)
          }
      }
      await matchAndUpsertFasil(fasilIntra);
      if (fasilIntra !== fasilEkskul) {
         await matchAndUpsertFasil(fasilEkskul);
      }

      // Find Jadwal and Siswa sections
      let jadwalStart = -1
      let siswaStart = -1
      
      for (let i = 0; i < data.length; i++) {
        if (data[i] && data[i][0] && String(data[i][0]).includes('JADWAL PEMBELAJARAN')) jadwalStart = i
        if (data[i] && data[i][0] && String(data[i][0]).includes('DATA SISWA')) siswaStart = i
      }

      // Process Jadwal
      if (jadwalStart !== -1) {
          // Read template rows from sheet
          let scheduleRows = []
          for (let i = jadwalStart + 2; i < (siswaStart !== -1 ? siswaStart : data.length); i++) {
              if (data[i] && data[i][0] && !isNaN(Number(data[i][0]))) {
                  scheduleRows.push({
                      pertemuan: Number(data[i][0]),
                      jenis: data[i][1],
                      tanggal: data[i][2],
                      hari: data[i][3],
                      jam: data[i][4],
                      kelas: data[i][5]
                  })
              }
          }

          if (scheduleRows.length > 0) {
              // Delete existing for this location
              await prisma.jadwalEkstra.deleteMany({ where: { lokasiSNT } })
              
              // We will generate 15 weeks based on the first week's day patterns.
              // Find baseline date (e.g. 10 Sep 2026 for week 1)
              let baselineDate = new Date(2026, 8, 10); // Default to Sept 10, 2026
              const firstRow = scheduleRows[0];
              if (firstRow && firstRow.tanggal) {
                  try {
                      // Format like "10 Sep 2026"
                      const parsed = parse(firstRow.tanggal, 'dd MMM yyyy', new Date(), { locale: id });
                      if (!isNaN(parsed.getTime())) baselineDate = parsed;
                  } catch (e) {}
              }

              // Extract day patterns from first week
              const week1Rows = scheduleRows.filter(r => r.pertemuan === 1);
              
              if (week1Rows.length > 0) {
                  for (let week = 1; week <= 15; week++) {
                      for (const pattern of week1Rows) {
                          // Find corresponding modul
                          const tingkat = String(pattern.jenis).toUpperCase().includes('SMA') ? 'SMA' : 'SMP';
                          const modul = modules.find(m => m.tingkatSekolah === tingkat && m.urutan === week);
                          
                          if (modul) {
                              const dayName = pattern.hari ? String(pattern.hari).trim() : 'Senin';
                              const dayNum = dayToNumber[dayName] !== undefined ? dayToNumber[dayName] : 1;
                              
                              // Calculate date: Baseline + (week-1) weeks. Then adjust to the required day of week.
                              let baseWeekDate = addDays(baselineDate, (week - 1) * 7);
                              let targetDate = nextDay(addDays(baseWeekDate, -7), dayNum);
                              
                              // Create
                              await prisma.jadwalEkstra.create({
                                  data: {
                                      mingguKe: week,
                                      tanggalMulai: targetDate,
                                      tanggalSelesai: targetDate,
                                      modulId: modul.id,
                                      lokasiSNT,
                                      tingkatSekolah: tingkat
                                  }
                              })
                          }
                      }
                  }
                  logs.push(`Jadwal di-generate hingga 15 pertemuan untuk ${lokasiSNT}`)
              }
          }
      }

      // Process Siswa
      if (siswaStart !== -1) {
          let count = 0
          const siswaPromises = []
          for (let i = siswaStart + 3; i < data.length; i++) { // Skip headers
              if (data[i] && data[i][0] && !isNaN(Number(data[i][0])) && data[i][1]) { // Valid row
                  const nama = String(data[i][1]).trim()
                  const kelas = String(data[i][2] || '').trim()
                  const nisn = String(data[i][3] || '').trim()
                  const jk = String(data[i][4] || '').trim()
                  const tglLahir = String(data[i][5] || '').trim()
                  const ortu = String(data[i][6] || '').trim()
                  const hp = String(data[i][7] || '').trim()

                  const dataSiswa = {
                      namaLengkap: nama,
                      kelas,
                      lokasiSNT,
                      nisn: nisn || null,
                      jenisKelamin: jk || null,
                      tanggalLahir: tglLahir || null,
                      namaOrangTua: ortu || null,
                      noHp: hp || null
                  }

                  siswaPromises.push(async () => {
                      let existingSiswa = null;
                      if (nisn) {
                          existingSiswa = await prisma.siswa.findFirst({ where: { nisn } })
                      }
                      if (!existingSiswa) {
                          existingSiswa = await prisma.siswa.findFirst({ where: { namaLengkap: nama, lokasiSNT } })
                      }
                      if (existingSiswa) {
                          await prisma.siswa.update({ where: { id: existingSiswa.id }, data: dataSiswa })
                      } else {
                          await prisma.siswa.create({ data: dataSiswa })
                      }
                  })
                  count++
              }
          }
          
          // Execute in chunks to avoid connection pool exhaustion
          const chunkSize = 10;
          for (let i = 0; i < siswaPromises.length; i += chunkSize) {
              const chunk = siswaPromises.slice(i, i + chunkSize);
              await Promise.all(chunk.map(fn => fn()));
          }
          logs.push(`Siswa: ${count} data disinkronkan untuk ${lokasiSNT}`)
      }
    }
    
    revalidatePath('/')
    return { success: true, logs }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message }
  }
}
