import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testUpdate() {
  const donny = await prisma.fasilitator.findFirst({ where: { namaLengkap: 'Donny' } })
  if (!donny) return console.log('Donny not found')
  
  console.log('Found Donny:', donny.id)
  
  const data = {
    namaLengkap: 'Donny Updated',
    email: 'donny@gmail.com',
    bankName: 'BCA',
    bankAccount: '1234567890',
    npwpNik: '1234567890123456',
  }
  
  try {
    const currentFasil = await prisma.fasilitator.findUnique({ where: { id: donny.id } })
    let userId = currentFasil?.userId || null

    if (data.email) {
      if (userId) {
        console.log('Updating user...', userId)
        await prisma.user.update({
          where: { id: userId },
          data: { 
            email: data.email,
            name: data.namaLengkap
          }
        })
        console.log('User updated successfully')
      }
    }

    console.log('Updating fasilitator...')
    const updated = await prisma.fasilitator.update({
      where: { id: donny.id },
      data: {
        namaLengkap: data.namaLengkap,
        jabatan: data.jabatan || null,
        instansi: data.instansi || null,
        nipNuptk: data.nipNuptk || null,
        nidn: data.nidn || null,
        pendidikan: data.pendidikan || null,
        klusterKeahlian: data.klusterKeahlian || null,
        mataPelajaran: data.mataPelajaran || null,
        kompetensi: data.kompetensi || null,
        sertifikasi: data.sertifikasi || null,
        alamat: data.alamat || null,
        kontak: data.kontak || null,
        email: data.email || null,
        bankName: data.bankName || null,
        bankAccount: data.bankAccount || null,
        npwpNik: data.npwpNik || null,
        statusKepegawaian: data.statusKepegawaian || null,
        pangkatGolongan: data.pangkatGolongan || null,
        userId: userId,
      }
    })
    console.log('Fasil updated successfully')
  } catch (err) {
    console.error('ERROR OCCURRED:', err)
  }
}

testUpdate().then(()=>prisma.$disconnect())
