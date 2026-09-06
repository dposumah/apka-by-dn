const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

code = code.replace(
  `  // Cek apakah ada relasi ke user
  const fasil = await prisma.fasilitator.findUnique({ where: { id } })
  if (fasil?.userId) {
    throw new Error('Fasilitator ini memiliki akun login yang aktif. Harap hapus akun User-nya terlebih dahulu jika ingin menghapus profil ini.')
  }`,
  `  // Cek apakah ada relasi ke user
  const fasil = await prisma.fasilitator.findUnique({ where: { id } })
  const userIdToDelete = fasil?.userId;`
)

code = code.replace(
  `  await prisma.fasilitator.delete({
    where: { id }
  })
  
  revalidatePath('/fasilitator')`,
  `  await prisma.fasilitator.delete({
    where: { id }
  })
  
  if (userIdToDelete) {
    await prisma.user.delete({ where: { id: userIdToDelete } }).catch(()=>console.log('User delete failed'))
  }
  
  revalidatePath('/fasilitator')`
)

fs.writeFileSync('src/app/actions/rab.ts', code)
