const fs = require('fs');

function addAttachmentToKwitansi(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to add the attachment section to getKwitansiHtml.
  // We look for:
  //         </div>
  //       </div>
  //     </div>
  //   `;
  // }
  //
  // inside getKwitansiHtml.

  const replacement = `
        </div>
        \${expense.receiptUrl ? \`
        <div style="page-break-before: always; padding: 40px; font-family: sans-serif; box-sizing: border-box; width: 100%; text-align: center;">
          <h3 style="margin-bottom: 20px;">Lampiran Bukti Pengeluaran</h3>
          <img src="\${expense.receiptUrl}" style="max-width: 100%; max-height: 900px; object-fit: contain; border: 1px solid #ccc; padding: 10px;" alt="Bukti Nota" crossorigin="anonymous" />
        </div>
        \` : ''}
      </div>
    \`;
  }`;

  content = content.replace(
    /        <\/div>\n      <\/div>\n    `;\n  }/g,
    replacement
  );

  fs.writeFileSync(filePath, content);
  console.log('Fixed ' + filePath);
}

addAttachmentToKwitansi('src/app/(snt)/dashboard-rab/client-page.tsx');
addAttachmentToKwitansi('src/app/(snt)/pengeluaran/form.tsx');
