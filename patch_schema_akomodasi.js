const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

const akomodasiModel = `
model FasilitatorAkomodasi {
  id              String      @id @default(cuid())
  fasilitatorId   String
  fasilitator     Fasilitator @relation(fields: [fasilitatorId], references: [id])
  tipe            String      // 'SEWA_RUMAH' atau 'AKOMODASI_TOT'
  
  // Fields for SEWA_RUMAH
  namaPemilik     String?
  alamatSewa      String?
  periodeSewa     String?
  hargaSewaBulan  Float?
  
  // Fields for AKOMODASI_TOT
  namaPenginapan  String?
  alamatPenginapan String?
  namaPengelola   String?
  namaKegiatan    String?
  tanggalMulai    DateTime?
  tanggalSelesai  DateTime?
  jumlahOrang     Int?
  jumlahKamar     Int?
  tarifPerMalam   Float?
  
  totalNominal    Float
  
  expenseId       String?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@map("fasilitator_akomodasi")
}
`;

if (!code.includes('model FasilitatorAkomodasi')) {
  code = code + '\n' + akomodasiModel;
  
  // Add relation to Fasilitator
  const fasilitatorEnd = code.indexOf('}', code.indexOf('model Fasilitator'));
  if (fasilitatorEnd !== -1) {
    code = code.substring(0, fasilitatorEnd) + '  akomodasi       FasilitatorAkomodasi[]\n' + code.substring(fasilitatorEnd);
  }
  
  fs.writeFileSync('prisma/schema.prisma', code);
  console.log('Schema updated.');
} else {
  console.log('Schema already updated.');
}
