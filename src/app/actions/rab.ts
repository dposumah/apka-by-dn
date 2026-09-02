'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getRabDashboardData() {
  const project = await prisma.rabProject.findFirst({
    include: {
      categories: {
        include: {
          items: {
            include: {
              expenses: {
                where: { status: 'APPROVED' }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!project) return null

  // Calculate totals
  let totalBudget = project.totalBudget
  let totalRealized = 0

  const categories = project.categories.map(cat => {
    let catBudget = 0
    let catRealized = 0

    const items = cat.items.map(item => {
      const realized = item.expenses.reduce((sum, exp) => sum + exp.amount, 0)
      catBudget += item.totalBudget
      catRealized += realized

      return {
        ...item,
        realized,
        remaining: item.totalBudget - realized
      }
    })

    totalRealized += catRealized

    return {
      ...cat,
      items,
      budget: catBudget,
      realized: catRealized,
      remaining: catBudget - catRealized
    }
  })

  return {
    ...project,
    categories,
    totalBudget,
    totalRealized,
    totalRemaining: totalBudget - totalRealized,
    percentage: totalBudget > 0 ? (totalRealized / totalBudget) * 100 : 0
  }
}

export async function getRecentExpenses(limit = 10) {
  return await prisma.expenseRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      rabItem: true,
      createdBy: {
        select: { name: true }
      }
    }
  })
}

export async function approveExpense(expenseId: string, status: 'APPROVED' | 'REJECTED') {
  await prisma.expenseRequest.update({
    where: { id: expenseId },
    data: { status } // simplified for now, ideally set approvedById
  })
  revalidatePath('/dashboard-rab')
}

export async function submitExpense(data: { rabItemId: string, amount: number, description: string, receiptUrl?: string, userId: string }) {
  let user = await prisma.user.findFirst()
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@korwil.com',
        password: 'hash',
        name: 'Demo Korwil',
        role: 'KORWIL'
      }
    })
  }

  await prisma.expenseRequest.create({
    data: {
      rabItemId: data.rabItemId,
      amount: data.amount,
      description: data.description,
      receiptUrl: data.receiptUrl,
      createdById: user.id
    }
  })
  revalidatePath('/dashboard-rab')
  revalidatePath('/pengeluaran')
}
