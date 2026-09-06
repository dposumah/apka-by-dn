const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add lokasiSNT to Fasilitator
schema = schema.replace(
  /pangkatGolongan\s+String\?/g,
  "pangkatGolongan   String?\n  lokasiSNT         String?"
);

// 2. Add RekapHonorarium array to Fasilitator
schema = schema.replace(
  /laporan\s+LaporanKegiatan\[\]/g,
  "laporan  LaporanKegiatan[]\n  rekapHonorarium RekapHonorarium[]"
);

// 3. Replace LaporanKegiatan model
const oldLaporanRegex = /model LaporanKegiatan \{[\s\S]*?\}/;
const newLaporan = model LaporanKegiatan {
  id            String      @id @default(cuid())
  fasilitatorId String
  fasilitator   Fasilitator @relation(fields: [fasilitatorId], references: [id])
  date          DateTime    @default(now())
  topic         String
  attendance    Int
  evaluation    String?
  
  tingkatSekolah String      @default("SMP")
  jenisKegiatan  String      @default("INTRAKURIKULER")
  jumlahJP       Int         @default(0)
  biayaTransport Float?      @default(0)
  statusTransport String     @default("PENDING") // PENDING, PAID
  
  foto1          String?
  foto2          String?

  rekapHonorariumId String?
  rekapHonorarium   RekapHonorarium? @relation(fields: [rekapHonorariumId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("laporan_kegiatan")
}

model RekapHonorarium {
  id            String      @id @default(cuid())
  fasilitatorId String
  fasilitator   Fasilitator @relation(fields: [fasilitatorId], references: [id])
  bulan         String      // format: "YYYY-MM"
  totalJP       Int         @default(0)
  totalHonor    Float       @default(0)
  filePdf       String?
  status        String      @default("DRAFT") // DRAFT, SUBMITTED, APPROVED, PAID

  laporan       LaporanKegiatan[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("rekap_honorarium")
};

schema = schema.replace(oldLaporanRegex, newLaporan);
fs.writeFileSync('prisma/schema.prisma', schema);
