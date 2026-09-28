const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', 'utf8');

// 1. Add imports
page = page.replace(
  /import \{ deleteExpense, generateKwitansiExpense \} from '@\/app\/actions\/rekap'/,
  "import { deleteExpense, generateKwitansiExpense, generateInvoiceExpense } from '@/app/actions/rekap'"
);

if (!page.includes('generateInvoiceExpense')) {
  page = page.replace(
    /import \{ deleteExpense, approveExpense \} from '@\/app\/actions\/rab'/,
    "import { deleteExpense, approveExpense } from '@/app/actions/rab'\nimport { generateKwitansiExpense, generateInvoiceExpense } from '@/app/actions/rekap'"
  );
}

// 2. Add state
page = page.replace(
  /const \[inputNoUrut, setInputNoUrut\] = useState\(""\)\n\s*const \[inputTanggal, setInputTanggal\] = useState\(""\)/,
  `const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputTanggal, setInputTanggal] = useState("")
  const [inputInvoiceNoUrut, setInputInvoiceNoUrut] = useState("")
  const [inputInvoiceTanggal, setInputInvoiceTanggal] = useState("")`
);

// 3. Clear state on open modal
page = page.replace(
  /setInputNoUrut\(""\)\n\s*const tzoffset/,
  `setInputNoUrut("")
    setInputInvoiceNoUrut("")
    const tzoffset`
);
page = page.replace(
  /setInputTanggal\(localISOTime\)/,
  `setInputTanggal(localISOTime)
    setInputInvoiceTanggal(localISOTime)`
);

// 4. Update getInvoiceHtml
page = page.replace(
  /const getInvoiceHtml = \(expense: any, kopType: string\) => \{/,
  "const getInvoiceHtml = (expense: any, record: any, kopType: string) => {"
);
page = page.replace(
  /<p><strong>Tanggal Diajukan:<\/strong> \$\{new Date\(expense\.createdAt\)\.toLocaleDateString\('id-ID'\)\}<\/p>/,
  `<p><strong>No Invoice:</strong> \${record?.noInvoice || '-'}</p>
            <p><strong>Tanggal Invoice:</strong> \${record?.tanggal ? new Date(record.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(expense.createdAt).toLocaleDateString('id-ID')}</p>`
);

// 5. Update handlePrintDokumen
page = page.replace(
  /if \(printInvoice\) \{\s*htmlString \+= getInvoiceHtml\(selectedExpense, selectedKop\);\s*\}/,
  `if (printInvoice) {
        const invRecord = await generateInvoiceExpense(selectedExpense.id, inputInvoiceNoUrut, inputInvoiceTanggal);
        htmlString += getInvoiceHtml(selectedExpense, invRecord, selectedKop);
      }`
);

// 6. Update handlePrint
page = page.replace(
  /if \(printInvoice\) \{\s*htmlString \+= getInvoiceHtml\(selectedExpense, selectedKop\);\s*\}/,
  `if (printInvoice) {
        const invRecord = await generateInvoiceExpense(selectedExpense.id, inputInvoiceNoUrut, inputInvoiceTanggal);
        htmlString += getInvoiceHtml(selectedExpense, invRecord, selectedKop);
      }`
);

// 7. Update UI to add inputs
page = page.replace(
  /\{printInvoice && \(\s*<div className="pl-6 space-y-2 border-l-2 border-green-200 ml-1">\s*<p className="text-sm font-medium text-gray-700">Pilih Kop Surat:<\/p>([\s\S]*?)<\/div>\s*\)/,
  `{printInvoice && (
                <div className="pl-6 space-y-4 border-l-2 border-green-200 ml-1">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Pilih Kop Surat:</p>
$1                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nomor Urut Invoice</label>
                      <input 
                        type="text" 
                        value={inputInvoiceNoUrut}
                        onChange={(e) => setInputInvoiceNoUrut(e.target.value)}
                        placeholder="Kosongkan untuk nomor otomatis"
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Invoice</label>
                      <input 
                        type="date" 
                        value={inputInvoiceTanggal}
                        onChange={(e) => setInputInvoiceTanggal(e.target.value)}
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                </div>
              )}`
);

fs.writeFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', page);
console.log('Fixed dashboard-rab UI');
