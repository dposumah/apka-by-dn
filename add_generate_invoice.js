const fs = require('fs');
let file = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const newAction = `
export async function generateInvoiceHonorRecord(rekapId: string, inputNoUrut?: string, inputTanggal?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized: Anda harus login untuk melakukan aksi ini." };

    const existing = await prisma.invoiceRecord.findFirst({ where: { rekapId } });
    
    const rekap = await prisma.rekapHonorarium.findUnique({
      where: { id: rekapId },
      include: { fasilitator: true }
    });
    
    if (!rekap) return { error: "Rekap not found" };
    
    const perihal = \`Honorarium Fasilitator \${rekap.fasilitator.namaLengkap} - Bulan \${rekap.bulan}\`;
    
    let finalNoUrut = inputNoUrut || "";
    if (!inputNoUrut) {
      if (existing) {
        if (existing.noInvoice.includes('TEMP') || existing.noInvoice === "") {
          finalNoUrut = existing.noUrut.toString().padStart(3, '0');
        } else {
          return JSON.parse(JSON.stringify(existing));
        }
      } else {
        const lastRecord = await prisma.invoiceRecord.findFirst({ orderBy: { noUrut: 'desc' } });
        finalNoUrut = ((lastRecord?.noUrut || 0) + 1).toString().padStart(3, '0');
      }
    }

    const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
    const noUrut = finalNoUrut;
    const d = inputTanggal ? new Date(inputTanggal) : new Date();
    const tanggalFormatted = \`\${d.getDate().toString().padStart(2, '0')}/\${(d.getMonth() + 1).toString().padStart(2, '0')}/\${d.getFullYear()}\`;
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perihal, noUrut, tanggal: tanggalFormatted, sheetName: 'Invoice' }),
        redirect: 'follow',
      });
      
      console.log('[InvoiceHonor] Response status:', response.status);
      const responseText = await response.text();
      
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('[InvoiceHonor] Failed to parse:', e);
        return { error: "Gagal parse response: " + responseText.substring(0, 100) };
      }
      
      if (result.error) return { error: result.error };
      
      let noInvoiceSheet = result.noSeri || result.noKwitansi || '';
      if (!noInvoiceSheet) {
        const parts = tanggalFormatted.split('/');
        if (parts.length === 3) {
          noInvoiceSheet = \`INV/MTC/\${parts[2]}.\${parts[1]}.\${parts[0]}.\${noUrut.toString().padStart(3, '0')}\`;
        } else {
          noInvoiceSheet = 'INV/TEMP/' + Date.now();
        }
      }
      
      let invoice;
      if (existing) {
        invoice = await prisma.invoiceRecord.update({
          where: { id: existing.id },
          data: { noInvoice: noInvoiceSheet, tanggal: d, perihal: perihal }
        });
      } else {
        invoice = await prisma.invoiceRecord.create({
          data: {
            noInvoice: noInvoiceSheet,
            perihal: perihal,
            nominal: rekap.totalHonor,
            rekapId: rekap.id,
            tanggal: d
          }
        });
      }
      
      return JSON.parse(JSON.stringify(invoice));
      
    } catch (error: any) {
      return { error: "Gagal memanggil webhook: " + error.message };
    }
  } catch (error: any) {
    console.error('Error in generateInvoiceHonorRecord:', error);
    return { error: error.message || 'Unknown error' };
  }
}
`;

if (!file.includes('generateInvoiceHonorRecord')) {
  file += newAction;
  fs.writeFileSync('src/app/actions/rekap.ts', file);
}
