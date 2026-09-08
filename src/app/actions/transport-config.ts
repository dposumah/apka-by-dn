"use server"

import { prisma } from "@/lib/prisma"

export async function getTransportConfig() {
  let config = await prisma.transportConfig.findFirst()
  if (!config) {
    config = await prisma.transportConfig.create({
      data: {
        rasioKonsumsiR2: 35,
        rasioKonsumsiR4: 10,
        kompensasiAkses: 10,
        hargaPertalite: 10000,
        hargaPertamax: 16300,
        hargaSolar: 6800,
        hargaDexlite: 24200,
      }
    })
  }
  return config
}

export async function updateTransportConfig(data: {
  rasioKonsumsiR2: number
  rasioKonsumsiR4: number
  kompensasiAkses: number
  hargaPertalite: number
  hargaPertamax: number
  hargaSolar: number
  hargaDexlite: number
}) {
  let config = await prisma.transportConfig.findFirst()
  if (config) {
    return prisma.transportConfig.update({
      where: { id: config.id },
      data
    })
  } else {
    return prisma.transportConfig.create({ data })
  }
}
