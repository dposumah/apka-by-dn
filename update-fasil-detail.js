const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

code = code.replace(
  /export async function getFasilitatorDetail\(id: string\) \{\s+return await prisma\.fasilitator\.findUnique\(\{\s+where: \{ id \},\s+include: \{\s+expenses: \{\s+include: \{\s+rabItem: true\s+\},\s+orderBy: \{ date: 'desc' \}\s+\}\s+\}\s+\}\)/,
  `export async function getFasilitatorDetail(id: string) {
  return await prisma.fasilitator.findUnique({
    where: { id },
    include: {
      expenses: {
        include: {
          rabItem: true
        },
        orderBy: { date: 'desc' }
      },
      laporan: {
        orderBy: { date: 'desc' }
      },
      rekapHonorarium: {
        orderBy: { bulan: 'desc' }
      }
    }
  })`
)

fs.writeFileSync('src/app/actions/rab.ts', code)
