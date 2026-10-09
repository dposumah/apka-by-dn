const fs = require('fs');

function fixPdfAttachment(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldAttachmentHtml = /\$\{expense\.receiptUrl \? `\s*<div style="page-break-before: always;[^>]+>\s*<h3[^>]+>Lampiran Bukti Pengeluaran<\/h3>\s*<img src="\$\{expense\.receiptUrl\}"[^>]+>\s*<\/div>\s*` : ''\}/g;

  const newAttachmentHtml = `\${expense.receiptUrl ? \`
        <div style="page-break-before: always; padding: 40px; font-family: sans-serif; box-sizing: border-box; width: 100%; text-align: center;">
          <h3 style="margin-bottom: 20px;">Lampiran Bukti Pengeluaran</h3>
          \${expense.receiptUrl.toLowerCase().endsWith('.pdf') 
            ? \`<div style="padding: 20px; border: 1px solid #ccc; background-color: #f9f9f9;">
                 <p>Lampiran ini berformat PDF dan tidak dapat dicetak secara langsung dalam halaman ini.</p>
                 <a href="\${expense.receiptUrl}" target="_blank" style="color: blue; text-decoration: underline;">Klik di sini untuk mengunduh/melihat PDF</a>
               </div>\`
            : \`<img src="\${expense.receiptUrl}" style="max-width: 100%; max-height: 900px; object-fit: contain; border: 1px solid #ccc; padding: 10px;" alt="Bukti Nota" />\`
          }
        </div>
        \` : ''}`;

  content = content.replace(oldAttachmentHtml, newAttachmentHtml);
  fs.writeFileSync(filePath, content);
  console.log('Fixed PDF attachment in ' + filePath);
}

fixPdfAttachment('src/app/(snt)/dashboard-rab/client-page.tsx');
fixPdfAttachment('src/app/(snt)/pengeluaran/form.tsx');
