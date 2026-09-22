const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const webhookLogic = `
export async function generateKwitansiHonor(rekapId: string) {
  // Check if it already exists locally
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
  
  const perihal = \`Honorarium Fasilitator \${rekap.fasilitator.namaLengkap} - Bulan \${rekap.bulan}\`;
  
  // Call Google Apps Script Webhook
  const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ perihal }),
    });
    
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    const noKwitansiSheet = result.noKwitansi;
    
    // Save to local database so we don't call webhook again for this rekap
    const kwitansi = await prisma.kwitansiRecord.create({
      data: {
        noKwitansi: noKwitansiSheet,
        perihal: perihal,
        nominal: rekap.totalHonor,
        rekapId: rekap.id
      }
    });
    
    return kwitansi;
    
  } catch (error: any) {
    console.error("Webhook Error:", error);
    throw new Error("Gagal mengambil nomor kwitansi dari Google Sheets: " + error.message);
  }
}
`;

// replace the old function with the new one
code = code.replace(/export async function generateKwitansiHonor\([\s\S]*?\n\}\n/m, webhookLogic);

fs.writeFileSync('src/app/actions/rekap.ts', code);
console.log('Updated action to use Webhook');
