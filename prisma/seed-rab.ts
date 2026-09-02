import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function parseRp(val: string): number {
  if (!val) return 0
  return Number(val.replace(/Rp|\./g, '').trim())
}

async function main() {
  const csvPath = path.join(__dirname, 'rab.csv')
  const csvData = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvData.split('\n').map((line) => line.trim()).filter((line) => line)

  // Clear existing
  await prisma.expenseRequest.deleteMany({})
  await prisma.rabItem.deleteMany({})
  await prisma.rabCategory.deleteMany({})
  await prisma.rabProject.deleteMany({})

  const project = await prisma.rabProject.create({
    data: {
      name: 'Penyelenggara Robotik (6 Lokasi)',
      totalBudget: 901919862,
    }
  })

  let currentCategory = null

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const cols = line.split(',')
    const no = cols[0]
    const uraian = cols[1]
    const volume = cols[2]
    const hargaSatuan = cols[3]
    const total = cols[4]

    if (no && no.includes('BIAYA')) {
      currentCategory = await prisma.rabCategory.create({
        data: {
          name: no,
          projectId: project.id
        }
      })
      continue
    }

    if (no && currentCategory && !no.includes('SUBTOTAL') && !no.includes('RINGKASAN') && !no.includes('TOTAL') && !no.includes('PPN') && !no.includes('PPh')) {
      await prisma.rabItem.create({
        data: {
          categoryId: currentCategory.id,
          code: no,
          name: uraian,
          volume: volume,
          unitPrice: parseRp(hargaSatuan),
          totalBudget: parseRp(total)
        }
      })
    }
  }

  console.log('RAB seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
