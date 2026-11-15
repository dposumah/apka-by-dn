'use server'

import prisma from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { ADMIN_ONLY_ROLES, checkAuth } from '@/lib/auth-check'

export async function changeUserPassword(userId: string, currentPass: string, newPass: string) {
  const { error: authError, session } = await checkAuth()
  if (authError || !session) return { error: authError || 'Unauthorized' }
  if (session.user.id !== userId && session.user.role !== 'ADMIN') return { error: 'Unauthorized' }

  if (!newPass || newPass.length < 6) {
    return { error: 'Password baru minimal 6 karakter' }
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { error: "User not found" }

    if (session.user.role !== 'ADMIN' || session.user.id === userId) {
      const isMatch = await bcrypt.compare(currentPass, user.password)
      if (!isMatch) {
        return { error: "Password saat ini salah" }
      }
    }

    const hashed = await bcrypt.hash(newPass, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    })

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return { error: message }
  }
}

export async function resetUserPassword(userId: string) {
  const { error: authError } = await checkAuth(ADMIN_ONLY_ROLES)
  if (authError) return { error: authError }

  try {
    const hashed = await bcrypt.hash('SNT2026', 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    })
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return { error: message }
  }
}

export async function updateAdminAccount(userId: string, data: { name: string, email: string }) {
  const { error: authError, session } = await checkAuth()
  if (authError || !session) return { error: authError || 'Unauthorized' }
  if (session.user.id !== userId && session.user.role !== 'ADMIN') return { error: 'Unauthorized' }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: data.name, email: data.email }
    })
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return { error: message }
  }
}

export async function createKorwilUser(data: { name: string, email: string, password: string }) {
  const { error: authError } = await checkAuth(ADMIN_ONLY_ROLES)
  if (authError) return { error: authError }

  if (!data.password || data.password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return { error: "Email sudah digunakan" }

    const hashed = await bcrypt.hash(data.password, 10)
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: 'KORWIL'
      }
    })
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server"
    return { error: message }
  }
}
