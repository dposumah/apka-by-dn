const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/sidebar.tsx', 'utf8')

// Add submenu support to MenuItem
code = code.replace(
  'fasilOnly?: boolean',
  'fasilOnly?: boolean\n  submenu?: { title: string; href: string }[]'
)

// Add submenus to Master Fasilitator
code = code.replace(
  '{ title: "Master Fasilitator", href: "/fasilitator", icon: "👥", adminOnly: true },',
  `{ 
    title: "Data Fasilitator", 
    href: "/fasilitator", 
    icon: "👥", 
    adminOnly: true,
    submenu: [
      { title: "Profil & Master Data", href: "/fasilitator" },
      { title: "Rekap Transport", href: "/fasilitator/transport" },
      { title: "Verifikasi Honorarium", href: "/dashboard-rab" }
    ]
  },`
)

// Wait, the user said "tambahkan submenu Laporan Mingguan dan Rekap Honorarium". 
// But "Laporan Mingguan" is currently just shown per fasilitator in their profile. We'd need a global "Laporan Mingguan" page!
// Right now, I didn't create a global "Laporan Mingguan" page for Admin. The Admin views them via `fasilitator/[id]`.
// Let's create `src/app/(snt)/fasilitator/laporan-mingguan` and `src/app/(snt)/fasilitator/rekap-honorarium`!

fs.writeFileSync('src/app/(snt)/sidebar.tsx', code)
