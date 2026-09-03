'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as bcrypt from 'bcryptjs'

export async function changeUserPassword(userId: string, currentPass: string, newPass: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { error: "User not found" }

    const isMatch = await bcrypt.compare(currentPass, user.password)
    if (!isMatch) {
      return { error: "Password saat ini salah" }
    }

    const hashed = await bcrypt.hash(newPass, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    })
    
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan server" }
  }
}

export async function resetUserPassword(userId: string) {
  try {
    const hashed = await bcrypt.hash('SNT2026', 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    })
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan server" }
  }
}

export async function updateAdminAccount(userId: string, data: { name: string, email: string }) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: data.name, email: data.email }
    })
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan server" }
  }
}
