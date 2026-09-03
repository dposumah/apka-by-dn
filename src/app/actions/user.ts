'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function changeUserPassword(userId: string, currentPass: string, newPass: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")

  const isMatch = await bcrypt.compare(currentPass, user.password)
  if (!isMatch) {
    throw new Error("Password saat ini salah")
  }

  const hashed = await bcrypt.hash(newPass, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed }
  })
  
  return { success: true }
}
export async function resetUserPassword(userId: string) {
  const hashed = await bcrypt.hash('SNT2026', 10)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed }
  })
  return { success: true }
}

export async function updateAdminAccount(userId: string, data: { name: string, email: string }) {
  await prisma.user.update({
    where: { id: userId },
    data: { name: data.name, email: data.email }
  })
  return { success: true }
}
