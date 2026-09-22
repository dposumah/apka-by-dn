const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const generateKwitansiAction = `
export async function generateKwitansiHonor(rekapId: string) {
  // Check if it already exists
  const existing = await prisma.kwitansiRecord.findUnique({
    where: { rekapId }
  });
  
  if (existing) {
    return existing;
  }
  
  // Get the rekap
  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: rekapId },
    include: { fasilitator: true }
  });
  
  if (!rekap) throw new Error("Rekap not found");
  
  // Create a placeholder kwitansi to get the auto-increment noUrut
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const perihal = \`Honorarium Fasilitator \${rekap.fasilitator.namaLengkap} - Bulan \${rekap.bulan}\`;
  
  const kwitansi = await prisma.kwitansiRecord.create({
    data: {
      noKwitansi: "TEMP-" + Date.now(), // temporary
      perihal: perihal,
      nominal: rekap.totalHonor,
      rekapId: rekap.id
    }
  });
  
  // Format the actual number
  const urutStr = String(kwitansi.noUrut).padStart(3, '0');
  const actualNoKwitansi = \`KWC/MTC/\${yyyy}.\${mm}.\${dd}.\${urutStr}\`;
  
  // Update it
  const finalKwitansi = await prisma.kwitansiRecord.update({
    where: { id: kwitansi.id },
    data: { noKwitansi: actualNoKwitansi }
  });
  
  return finalKwitansi;
}
`;

code = code + '\n' + generateKwitansiAction;
fs.writeFileSync('src/app/actions/rekap.ts', code);
console.log('Added generateKwitansiHonor action');
