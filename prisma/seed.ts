import { PrismaClient, AccountType, NormalBalance, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai seeding database...')

  // ==================== Create Admin User ====================
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apka.com' },
    update: {},
    create: {
      email: 'admin@apka.com',
      password: hashedPassword,
      name: 'Administrator',
      role: UserRole.ADMIN,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create Accountant user
  const accountant = await prisma.user.upsert({
    where: { email: 'akuntan@apka.com' },
    update: {},
    create: {
      email: 'akuntan@apka.com',
      password: await bcrypt.hash('akuntan123', 12),
      name: 'Akuntan',
      role: UserRole.ACCOUNTANT,
    },
  })
  console.log('✅ Accountant user created:', accountant.email)

  // ==================== Create Company ====================
  const company = await prisma.company.create({
    data: {
      name: 'APKA by DN',
      address: 'Jl. Contoh No. 123, Jakarta',
      phone: '021-1234567',
      email: 'info@apka.com',
      npwp: '00.000.000.0-000.000',
      taxType: 'PKP',
    },
  })
  console.log('✅ Company created:', company.name)

  // ==================== Create Fiscal Period ====================
  const fiscalPeriod = await prisma.fiscalPeriod.create({
    data: {
      name: '2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'OPEN',
      companyId: company.id,
    },
  })
  console.log('✅ Fiscal period created:', fiscalPeriod.name)

  // ==================== Create Chart of Accounts (SAK EMKM) ====================
  const accounts = [
    // ASET (1xxx)
    { code: '1000', name: 'Aset', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 1, subType: 'Header' },
    { code: '1100', name: 'Aset Lancar', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 2, subType: 'Header', parentCode: '1000' },
    { code: '1110', name: 'Kas', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Kas', parentCode: '1100' },
    { code: '1111', name: 'Kas Kecil', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 4, subType: 'Kas', parentCode: '1110' },
    { code: '1112', name: 'Kas Besar', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 4, subType: 'Kas', parentCode: '1110' },
    { code: '1120', name: 'Bank', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Bank', parentCode: '1100' },
    { code: '1121', name: 'Bank BCA', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 4, subType: 'Bank', parentCode: '1120' },
    { code: '1122', name: 'Bank Mandiri', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 4, subType: 'Bank', parentCode: '1120' },
    { code: '1130', name: 'Piutang Usaha', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Piutang', parentCode: '1100' },
    { code: '1140', name: 'Piutang Lain-lain', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Piutang', parentCode: '1100' },
    { code: '1150', name: 'Persediaan Barang Dagang', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Persediaan', parentCode: '1100' },
    { code: '1160', name: 'Perlengkapan', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Perlengkapan', parentCode: '1100' },
    { code: '1170', name: 'Biaya Dibayar Dimuka', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Dibayar Dimuka', parentCode: '1100' },
    { code: '1180', name: 'PPN Masukan', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Pajak', parentCode: '1100' },
    { code: '1200', name: 'Aset Tetap', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 2, subType: 'Header', parentCode: '1000' },
    { code: '1210', name: 'Tanah', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Aset Tetap', parentCode: '1200' },
    { code: '1220', name: 'Bangunan', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Aset Tetap', parentCode: '1200' },
    { code: '1221', name: 'Akumulasi Penyusutan Bangunan', type: AccountType.ASSET, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Akumulasi Penyusutan', parentCode: '1200' },
    { code: '1230', name: 'Kendaraan', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Aset Tetap', parentCode: '1200' },
    { code: '1231', name: 'Akumulasi Penyusutan Kendaraan', type: AccountType.ASSET, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Akumulasi Penyusutan', parentCode: '1200' },
    { code: '1240', name: 'Peralatan', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Aset Tetap', parentCode: '1200' },
    { code: '1241', name: 'Akumulasi Penyusutan Peralatan', type: AccountType.ASSET, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Akumulasi Penyusutan', parentCode: '1200' },
    { code: '1250', name: 'Inventaris Kantor', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Aset Tetap', parentCode: '1200' },
    { code: '1251', name: 'Akumulasi Penyusutan Inventaris', type: AccountType.ASSET, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Akumulasi Penyusutan', parentCode: '1200' },

    // LIABILITAS (2xxx)
    { code: '2000', name: 'Liabilitas', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 1, subType: 'Header' },
    { code: '2100', name: 'Liabilitas Jangka Pendek', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 2, subType: 'Header', parentCode: '2000' },
    { code: '2110', name: 'Hutang Usaha', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Hutang Usaha', parentCode: '2100' },
    { code: '2120', name: 'Hutang Lain-lain', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Hutang Lain-lain', parentCode: '2100' },
    { code: '2130', name: 'Hutang Pajak', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Hutang Pajak', parentCode: '2100' },
    { code: '2131', name: 'Hutang PPN Keluaran', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 4, subType: 'Hutang Pajak', parentCode: '2130' },
    { code: '2132', name: 'Hutang PPh 21', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 4, subType: 'Hutang Pajak', parentCode: '2130' },
    { code: '2133', name: 'Hutang PPh 23', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 4, subType: 'Hutang Pajak', parentCode: '2130' },
    { code: '2134', name: 'Hutang PPh Final', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 4, subType: 'Hutang Pajak', parentCode: '2130' },
    { code: '2140', name: 'Hutang Gaji', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Hutang Gaji', parentCode: '2100' },
    { code: '2150', name: 'Pendapatan Diterima Dimuka', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Diterima Dimuka', parentCode: '2100' },
    { code: '2200', name: 'Liabilitas Jangka Panjang', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 2, subType: 'Header', parentCode: '2000' },
    { code: '2210', name: 'Hutang Bank', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Hutang Bank', parentCode: '2200' },

    // EKUITAS (3xxx)
    { code: '3000', name: 'Ekuitas', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, level: 1, subType: 'Header' },
    { code: '3100', name: 'Modal Pemilik', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, level: 2, subType: 'Modal', parentCode: '3000' },
    { code: '3200', name: 'Modal Disetor', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, level: 2, subType: 'Modal', parentCode: '3000' },
    { code: '3300', name: 'Laba Ditahan', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, level: 2, subType: 'Laba Ditahan', parentCode: '3000' },
    { code: '3400', name: 'Laba Periode Berjalan', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, level: 2, subType: 'Laba Berjalan', parentCode: '3000' },
    { code: '3500', name: 'Prive', type: AccountType.EQUITY, normalBalance: NormalBalance.DEBIT, level: 2, subType: 'Prive', parentCode: '3000' },

    // PENDAPATAN (4xxx)
    { code: '4000', name: 'Pendapatan', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, level: 1, subType: 'Header' },
    { code: '4100', name: 'Pendapatan Usaha', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, level: 2, subType: 'Header', parentCode: '4000' },
    { code: '4110', name: 'Penjualan Barang Dagang', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Penjualan', parentCode: '4100' },
    { code: '4120', name: 'Pendapatan Jasa', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Pendapatan Jasa', parentCode: '4100' },
    { code: '4130', name: 'Diskon Penjualan', type: AccountType.REVENUE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Diskon', parentCode: '4100' },
    { code: '4140', name: 'Retur Penjualan', type: AccountType.REVENUE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Retur', parentCode: '4100' },
    { code: '4200', name: 'Pendapatan Lain-lain', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, level: 2, subType: 'Header', parentCode: '4000' },
    { code: '4210', name: 'Pendapatan Bunga', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Pendapatan Lain', parentCode: '4200' },
    { code: '4220', name: 'Pendapatan Lain-lain', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, level: 3, subType: 'Pendapatan Lain', parentCode: '4200' },

    // BEBAN (5xxx)
    { code: '5000', name: 'Beban', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 1, subType: 'Header' },
    { code: '5100', name: 'Harga Pokok Penjualan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 2, subType: 'HPP', parentCode: '5000' },
    { code: '5110', name: 'HPP Barang Dagang', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'HPP', parentCode: '5100' },
    { code: '5120', name: 'HPP Jasa', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'HPP', parentCode: '5100' },
    { code: '5200', name: 'Beban Operasional', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 2, subType: 'Header', parentCode: '5000' },
    { code: '5210', name: 'Beban Gaji & Upah', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Gaji', parentCode: '5200' },
    { code: '5220', name: 'Beban Sewa', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Sewa', parentCode: '5200' },
    { code: '5230', name: 'Beban Listrik, Air & Telepon', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Utilitas', parentCode: '5200' },
    { code: '5240', name: 'Beban Perlengkapan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Perlengkapan', parentCode: '5200' },
    { code: '5250', name: 'Beban Transportasi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Transportasi', parentCode: '5200' },
    { code: '5260', name: 'Beban Asuransi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Asuransi', parentCode: '5200' },
    { code: '5270', name: 'Beban Penyusutan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Penyusutan', parentCode: '5200' },
    { code: '5280', name: 'Beban Iklan & Promosi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Iklan', parentCode: '5200' },
    { code: '5290', name: 'Beban Pemeliharaan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Pemeliharaan', parentCode: '5200' },
    { code: '5300', name: 'Beban Administrasi & Umum', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Admin', parentCode: '5200' },
    { code: '5310', name: 'Beban Pajak', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Pajak', parentCode: '5200' },
    { code: '5400', name: 'Beban Lain-lain', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 2, subType: 'Header', parentCode: '5000' },
    { code: '5410', name: 'Beban Bunga', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Bunga', parentCode: '5400' },
    { code: '5420', name: 'Beban Administrasi Bank', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Bank', parentCode: '5400' },
    { code: '5430', name: 'Beban Lain-lain', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, level: 3, subType: 'Beban Lain', parentCode: '5400' },
  ]

  // First pass: create all accounts without parent references
  const accountMap = new Map<string, string>() // code -> id

  for (const acc of accounts) {
    const { parentCode, ...data } = acc as any
    const created = await prisma.account.upsert({
      where: { code: data.code },
      update: {},
      create: {
        code: data.code,
        name: data.name,
        type: data.type,
        normalBalance: data.normalBalance,
        level: data.level,
        subType: data.subType,
        isActive: true,
      },
    })
    accountMap.set(data.code, created.id)
  }

  // Second pass: set parent references
  for (const acc of accounts) {
    const { parentCode } = acc as any
    if (parentCode && accountMap.has(parentCode)) {
      await prisma.account.update({
        where: { code: acc.code },
        data: { parentId: accountMap.get(parentCode) },
      })
    }
  }
  console.log(`✅ ${accounts.length} akun berhasil dibuat (Chart of Accounts SAK EMKM)`)

  // ==================== Create Default Tax Rates ====================
  const taxRates = [
    { name: 'PPN', rate: 11, type: 'PPN' as const, isActive: true },
    { name: 'PPh 21', rate: 5, type: 'PPH21' as const, isActive: true },
    { name: 'PPh 23 - Jasa', rate: 2, type: 'PPH23' as const, isActive: true },
    { name: 'PPh Final UMKM', rate: 0.5, type: 'PPH_FINAL' as const, isActive: true },
  ]

  for (const tax of taxRates) {
    await prisma.taxRate.create({ data: tax })
  }
  console.log(`✅ ${taxRates.length} tarif pajak default berhasil dibuat`)

  console.log('')
  console.log('🎉 Seeding selesai!')
  console.log('')
  console.log('📋 Akun Login:')
  console.log('   Admin    : admin@apka.com / admin123')
  console.log('   Akuntan  : akuntan@apka.com / akuntan123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error saat seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
