const fs = require('fs')
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

const deleteAction = `
export async function deleteFasilitator(id: string) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Cek apakah ada relasi ke user
  const fasil = await prisma.fasilitator.findUnique({ where: { id } })
  if (fasil?.userId) {
    throw new Error('Fasilitator ini memiliki akun login yang aktif. Harap hapus akun User-nya terlebih dahulu jika ingin menghapus profil ini.')
  }

  // Delete related Laporan Kegiatan and Rekap Honorarium first
  await prisma.laporanKegiatan.deleteMany({ where: { fasilitatorId: id } })
  await prisma.rekapHonorarium.deleteMany({ where: { fasilitatorId: id } })
  await prisma.expenseRequest.deleteMany({ where: { fasilitatorId: id } })

  await prisma.fasilitator.delete({
    where: { id }
  })
  
  revalidatePath('/fasilitator')
}
`

code += deleteAction
fs.writeFileSync('src/app/actions/rab.ts', code)
