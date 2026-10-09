const fs = require('fs');

const dashPath = 'src/app/(snt)/dashboard-rab/client-page.tsx';
let content = fs.readFileSync(dashPath, 'utf8');

// Fix both handlePrint and handlePrintDokumen kwitansi calls
// Find pattern: record = await generateKwitansiExpense(...);  followed by htmlString += getKwitansiHtml(...)
// We need to add error check between them

// Pattern for the second occurrence (first one already fixed)
const searchPattern = /const record = await generateKwitansiExpense\(selectedExpense\.id, inputNoUrut, inputTanggal\);\s*\n?\s*htmlString \+= getKwitansiHtml\(selectedExpense, record\);/g;

const matches = content.match(searchPattern);
console.log('Found matches:', matches ? matches.length : 0);

if (matches && matches.length > 0) {
  // Replace all remaining occurrences
  content = content.replace(searchPattern, (match) => {
    return `const record = await generateKwitansiExpense(selectedExpense.id, inputNoUrut, inputTanggal);
        if (record?.error) {
          alert('Gagal generate kwitansi: ' + record.error);
          setIsGeneratingPdf(false);
          return;
        }
        htmlString += getKwitansiHtml(selectedExpense, record);`;
  });
  
  fs.writeFileSync(dashPath, content);
  console.log('Fixed remaining kwitansi error checks');
} else {
  console.log('No more unpatched occurrences found (already fixed)');
}
