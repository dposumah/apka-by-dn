const fs = require('fs');
const filePath = 'src/app/actions/rekap.ts';
let content = fs.readFileSync(filePath, 'utf8');

const invoiceExpenseReplacement = `
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ perihal, noUrut, tanggal: tanggalFormatted, sheetName: 'Invoice' }),
          redirect: 'follow',
        });
        
        console.log('[InvoiceExpense] Response status:', response.status);
        const responseText = await response.text();
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error('[InvoiceExpense] Failed to parse:', e);
          return { error: "Gagal parse response: " + responseText.substring(0, 100) };
        }
        
        if (result.error) return { error: result.error };
        
        let noInvoiceSheet = result.noSeri || result.noKwitansi || ('INV/TEMP/' + Date.now() + Math.floor(Math.random()*1000));
        const checkConflict = await prisma.invoiceRecord.findUnique({ where: { noInvoice: noInvoiceSheet } });
        if (checkConflict && (!existing || checkConflict.id !== existing.id)) {
          noInvoiceSheet = noInvoiceSheet + '-' + Math.floor(Math.random() * 10000);
        }
`;

content = content.replace(
  /try \{\s*const response = await fetch\(webhookUrl, \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{ perihal, noUrut, tanggal: tanggalFormatted, sheetName: 'Invoice' \}\),\s*\}\);\s*if \(!response\.ok\) return \{ error: "HTTP error " \+ response\.status \};\s*const result = await response\.json\(\);\s*if \(result\.error\) return \{ error: result\.error \};\s*let noInvoiceSheet = result\.noSeri \|\| result\.noKwitansi \|\| \('INV\/TEMP\/' \+ Date\.now\(\) \+ Math\.floor\(Math\.random\(\)\*1000\)\);\s*const checkConflict = await prisma\.invoiceRecord\.findUnique\(\{ where: \{ noInvoice: noInvoiceSheet \} \}\);\s*if \(checkConflict && \(!existing \|\| checkConflict\.id !== existing\.id\)\) \{\s*noInvoiceSheet = noInvoiceSheet \+ '-' \+ Math\.floor\(Math\.random\(\) \* 10000\);\s*\}/g,
  invoiceExpenseReplacement
);

// Also apply for generateKwitansiTransportBulanan
const transportBulananReplacement = `
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perihal, noUrut, tanggal: tanggalFormatted }),
      redirect: 'follow',
    });
    
    console.log('[TransportBulanan] Response status:', response.status);
    const responseText = await response.text();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('[TransportBulanan] Failed to parse:', e);
      return { error: "Gagal parse response: " + responseText.substring(0, 100) };
    }
    
    if (result.error) return { error: result.error };
    
    let noKwitansiSheet = result.noSeri || result.noKwitansi || ('KWT/TEMP/' + Date.now());
    const checkConflict = await prisma.kwitansiRecord.findUnique({ where: { noKwitansi: noKwitansiSheet } });
    if (checkConflict && (!existing || checkConflict.id !== existing.id)) {
      noKwitansiSheet = noKwitansiSheet + '-' + Math.floor(Math.random() * 10000);
    }
`;

content = content.replace(
  /try \{\s*const response = await fetch\(webhookUrl, \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{ perihal, noUrut, tanggal: tanggalFormatted \}\),\s*\}\);\s*if \(!response\.ok\) return \{ error: "HTTP error " \+ response\.status \};\s*const result = await response\.json\(\);\s*if \(result\.error\) return \{ error: result\.error \};\s*let noKwitansiSheet = result\.noSeri \|\| result\.noKwitansi \|\| \('KWT\/TEMP\/' \+ Date\.now\(\) \+ Math\.floor\(Math\.random\(\)\*1000\)\);\s*const checkConflict = await prisma\.kwitansiRecord\.findUnique\(\{ where: \{ noKwitansi: noKwitansiSheet \} \}\);\s*if \(checkConflict && \(!existing \|\| checkConflict\.id !== existing\.id\)\) \{\s*noKwitansiSheet = noKwitansiSheet \+ '-' \+ Math\.floor\(Math\.random\(\) \* 10000\);\s*\}/g,
  transportBulananReplacement
);

fs.writeFileSync(filePath, content);
console.log('Fixed fetch redirects in rekap.ts');
