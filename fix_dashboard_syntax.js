const fs = require('fs');

function fixSyntax(file) {
  let c = fs.readFileSync(file, 'utf8');
  
  // Fix the missing backticks in getInvoiceHtml and getKwitansiHtml
  c = c.replace(/return\s*<div/g, 'return `\n      <div');
  
  // Replace the ending div of the template with </div>`
  c = c.replace(/<\/table>\n\s*<\/div>\n\s*}/g, '</table>\n      </div>\n    `;\n  }');
  c = c.replace(/<p style="margin-top: 50px;">\s*<br\/>\s*<br\/>\s*\(_____________________\)\s*<\/p>\n\s*<\/div>\n\s*<\/div>\n\s*}/g, '<p style="margin-top: 50px;">\n            <br/>\n            <br/>\n            (_____________________)\n          </p>\n        </div>\n      </div>\n    `;\n  }');
  
  // Replace the + concatenation with template literals
  c = c.replace(/" \+ kopImage \+ "/g, '${kopImage}');
  c = c.replace(/" \+ expense\.rabItem\.name \+ "/g, '${expense.rabItem.name}');
  c = c.replace(/" \+ expense\.status \+ "/g, '${expense.status}');
  c = c.replace(/" \+ record\.noKwitansi \+ "/g, '${record.noKwitansi}');
  c = c.replace(/" \+ formatCurrency\(expense\.amount\) \+ "/g, '${formatCurrency(expense.amount)}');
  c = c.replace(/" \+ terbilangRupiah\(expense\.amount\) \+ "/g, '${terbilangRupiah(expense.amount)}');
  c = c.replace(/" \+ expense\.description \+ "/g, '${expense.description}');
  c = c.replace(/" \+ \(expense\.fasilitator \? <p><strong>Nama Fasilitator:<\/strong> " \+ expense\.fasilitator\.namaLengkap \+ "<\/p>" : ''\) \+ "/g, '${expense.fasilitator ? `<p><strong>Nama Fasilitator:</strong> ${expense.fasilitator.namaLengkap}</p>` : ``}');
  c = c.replace(/" \+ new Date\(expense\.createdAt\)\.toLocaleDateString\('id-ID'\) \+ "/g, '${new Date(expense.createdAt).toLocaleDateString(\'id-ID\')}');
  
  fs.writeFileSync(file, c);
}

fixSyntax('src/app/(snt)/dashboard-rab/client-page.tsx');
fixSyntax('src/app/(snt)/pengeluaran/form.tsx');
