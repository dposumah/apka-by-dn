const fs = require('fs');

const rekapPath = 'src/app/actions/rekap.ts';
let content = fs.readFileSync(rekapPath, 'utf8');

// 1. Fix KwitansiExpense
const kwtExpPattern = /let noKwitansiSheet = result\.noSeri \|\| result\.noKwitansi \|\| '';\s*console\.log\('\[KwitansiExpense\] noKwitansiSheet extracted:', noKwitansiSheet\);\s*if \(!noKwitansiSheet\) \{\s*noKwitansiSheet = 'KWT\/TEMP\/' \+ Date\.now\(\);\s*console\.warn\('\[KwitansiExpense\] No serial number in response, using TEMP:', noKwitansiSheet\);\s*\}/g;

const kwtExpReplacement = `let noKwitansiSheet = result.noSeri || result.noKwitansi || '';
      console.log('[KwitansiExpense] noKwitansiSheet extracted:', noKwitansiSheet);

      if (!noKwitansiSheet) {
        // Fallback: construct it manually if Apps Script returned empty string due to formula calculation delay
        const parts = tanggalFormatted.split('/'); // DD/MM/YYYY
        if (parts.length === 3) {
          noKwitansiSheet = \`KWC/MTC/\${parts[2]}.\${parts[1]}.\${parts[0]}.\${noUrut.toString().padStart(3, '0')}\`;
          console.log('[KwitansiExpense] Constructed manually:', noKwitansiSheet);
        } else {
          noKwitansiSheet = 'KWT/TEMP/' + Date.now();
        }
      }`;

content = content.replace(kwtExpPattern, kwtExpReplacement);

// 2. Fix KwitansiHonor
const kwtHonorPattern = /let noKwitansiSheet = result\.noSeri \|\| result\.noKwitansi \|\| '';\s*console\.log\('\[KwitansiHonor\] noKwitansiSheet:', noKwitansiSheet\);\s*if \(!noKwitansiSheet\) \{\s*noKwitansiSheet = 'KWT\/TEMP\/' \+ Date\.now\(\);\s*console\.warn\('\[KwitansiHonor\] No serial number, using TEMP'\);\s*\}/g;

const kwtHonorReplacement = `let noKwitansiSheet = result.noSeri || result.noKwitansi || '';
    console.log('[KwitansiHonor] noKwitansiSheet:', noKwitansiSheet);
    
    if (!noKwitansiSheet) {
      const parts = tanggalFormatted.split('/');
      if (parts.length === 3) {
        noKwitansiSheet = \`KWC/MTC/\${parts[2]}.\${parts[1]}.\${parts[0]}.\${noUrut.toString().padStart(3, '0')}\`;
        console.log('[KwitansiHonor] Constructed manually:', noKwitansiSheet);
      } else {
        noKwitansiSheet = 'KWT/TEMP/' + Date.now();
      }
    }`;

content = content.replace(kwtHonorPattern, kwtHonorReplacement);

// 3. Fix TransportBulanan
const transBulananPattern = /let noKwitansiSheet = result\.noSeri \|\| result\.noKwitansi \|\| \('KWT\/TEMP\/' \+ Date\.now\(\)\);\s*const checkConflict = await prisma\.kwitansiRecord\.findUnique/g;

const transBulananReplacement = `let noKwitansiSheet = result.noSeri || result.noKwitansi || '';
    if (!noKwitansiSheet) {
      const parts = tanggalFormatted.split('/');
      if (parts.length === 3) {
        noKwitansiSheet = \`KWC/MTC/\${parts[2]}.\${parts[1]}.\${parts[0]}.\${noUrut.toString().padStart(3, '0')}\`;
      } else {
        noKwitansiSheet = 'KWT/TEMP/' + Date.now();
      }
    }
    const checkConflict = await prisma.kwitansiRecord.findUnique`;

content = content.replace(transBulananPattern, transBulananReplacement);

// 4. Fix InvoiceExpense
const invExpensePattern = /let noInvoiceSheet = result\.noSeri \|\| result\.noKwitansi \|\| \('INV\/TEMP\/' \+ Date\.now\(\) \+ Math\.floor\(Math\.random\(\)\*1000\)\);\s*const checkConflict = await prisma\.invoiceRecord\.findUnique/g;

const invExpenseReplacement = `let noInvoiceSheet = result.noSeri || result.noKwitansi || '';
        if (!noInvoiceSheet) {
          const parts = tanggalFormatted.split('/');
          if (parts.length === 3) {
            noInvoiceSheet = \`INV/MTC/\${parts[2]}.\${parts[1]}.\${parts[0]}.\${noUrut.toString().padStart(3, '0')}\`;
          } else {
            noInvoiceSheet = 'INV/TEMP/' + Date.now();
          }
        }
        const checkConflict = await prisma.invoiceRecord.findUnique`;

content = content.replace(invExpensePattern, invExpenseReplacement);

fs.writeFileSync(rekapPath, content);
console.log('Added manual string construction fallback to all webhooks.');
