const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const webhookLogic = `
export async function generateKwitansiHonor(rekapId: string, inputNoUrut?: string, inputTanggal?: string) {
  // Check if it already exists locally
  const existing = await prisma.kwitansiRecord.findUnique({
    where: { rekapId }
  });
  
  // Get the rekap
  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: rekapId },
    include: { fasilitator: true }
  });
  
  if (!rekap) throw new Error("Rekap not found");
  
  const perihal = \`Honorarium Fasilitator \${rekap.fasilitator.namaLengkap} - Bulan \${rekap.bulan}\`;
  
  // If we already have a record and the user is NOT providing new inputs to overwrite, return existing.
  // But wait, the user wants to input it. If they input it, they expect a new number!
  // So if inputNoUrut is provided, we should probably ignore 'existing' check and fetch a new one?
  // Let's just always call webhook if they provide inputs, or return existing if not.
  if (existing && !inputNoUrut) {
    return existing;
  }
  
  // Call Google Apps Script Webhook
  const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
  
  // Default values if not provided (should be provided by the new UI though)
  const noUrut = inputNoUrut || "";
  const d = inputTanggal ? new Date(inputTanggal) : new Date();
  const tanggalFormatted = \`\${d.getDate().toString().padStart(2, '0')}/\${(d.getMonth() + 1).toString().padStart(2, '0')}/\${d.getFullYear()}\`;
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ perihal, noUrut: noUrut, tanggal: tanggalFormatted }),
    });
    
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    const noKwitansiSheet = result.noKwitansi;
    
    // Save to local database
    let kwitansi;
    if (existing) {
      kwitansi = await prisma.kwitansiRecord.update({
        where: { id: existing.id },
        data: {
          noKwitansi: noKwitansiSheet,
          tanggal: d
        }
      });
    } else {
      kwitansi = await prisma.kwitansiRecord.create({
        data: {
          noKwitansi: noKwitansiSheet,
          perihal: perihal,
          nominal: rekap.totalHonor,
          rekapId: rekap.id,
          tanggal: d
        }
      });
    }
    
    return kwitansi;
    
  } catch (error: any) {
    console.error("Webhook Error:", error);
    throw new Error("Gagal mengambil nomor kwitansi dari Google Sheets: " + error.message);
  }
}
`;

code = code.replace(/export async function generateKwitansiHonor\([\s\S]*?\n\}\n/m, webhookLogic);

fs.writeFileSync('src/app/actions/rekap.ts', code);
console.log('Updated server action to accept manual inputs');
