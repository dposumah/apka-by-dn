const fs = require('fs');

const formPath = 'src/app/(snt)/pengeluaran/form.tsx';
let content = fs.readFileSync(formPath, 'utf8');

const searchPattern = /const record = await generateKwitansiExpense\(submittedExpense\.id, inputNoUrut, inputTanggal\);\s*\n?\s*htmlString \+= getKwitansiHtml\(submittedExpense, record\);/g;

const matches = content.match(searchPattern);
console.log('Found matches in form.tsx:', matches ? matches.length : 0);

if (matches && matches.length > 0) {
  content = content.replace(searchPattern, (match) => {
    return `const record = await generateKwitansiExpense(submittedExpense.id, inputNoUrut, inputTanggal);
          if (record?.error) {
            alert('Gagal generate kwitansi: ' + record.error);
            setIsGeneratingPdf(false);
            return;
          }
          htmlString += getKwitansiHtml(submittedExpense, record);`;
  });
  
  fs.writeFileSync(formPath, content);
  console.log('Fixed form.tsx kwitansi error check');
} else {
  console.log('No matches found');
}
