const fs = require('fs')
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

const toggleAction = `
export async function toggleFasilitatorStatus(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const fasil = await prisma.fasilitator.update({
    where: { id },
    data: { isActive }
  })
  
  if (fasil.userId) {
    await prisma.user.update({
      where: { id: fasil.userId },
      data: { isActive }
    })
  }
  
  revalidatePath('/fasilitator')
}
`

code += toggleAction
fs.writeFileSync('src/app/actions/rab.ts', code)
