import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function parseCSVRow(row: string) {
  const result = []
  let inQuotes = false
  let currentVal = ''
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal.trim())
      currentVal = ''
    } else {
      currentVal += char
    }
  }
  result.push(currentVal.trim())
  return result
}

async function main() {
  const csvPath = path.join(__dirname, 'fasilitator.csv')
  const csvData = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvData.split('\n').map(l => l.trim()).filter(l => l)

  await prisma.fasilitator.deleteMany({})

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const cols = parseCSVRow(line)
    
    // Check if it's valid data row
    if (cols.length < 5 || !cols[0] || isNaN(Number(cols[0]))) continue

    await prisma.fasilitator.create({
      data: {
        namaLengkap: cols[1] || '',
        jabatan: cols[2],
        instansi: cols[3],
        nipNuptk: cols[4],
        nidn: cols[5],
        pendidikan: cols[6],
        klusterKeahlian: cols[7],
        mataPelajaran: cols[8],
        kompetensi: cols[9],
        sertifikasi: cols[10],
        alamat: cols[11],
        kontak: cols[12],
        email: cols[13]
      }
    })
  }

  console.log('Fasilitator seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
