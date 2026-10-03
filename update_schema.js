const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add jarakPPKm to Fasilitator model (after besaranTransport)
schema = schema.replace(
  'besaranTransport  Float   @default(120000)',
  'besaranTransport  Float   @default(120000)\n  jarakPPKm         Float   @default(0) // Jarak PP kedudukan ke lokasi kegiatan (km)'
);

// 2. Add AppSetting model at the end
if (!schema.includes('model AppSetting')) {
  schema += `

// ==================== APP SETTINGS ====================

model AppSetting {
  id    String @id @default(cuid())
  key   String @unique
  value String
  label String?

  updatedAt DateTime @updatedAt

  @@map("app_settings")
}
`;
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated with jarakPPKm and AppSetting');
