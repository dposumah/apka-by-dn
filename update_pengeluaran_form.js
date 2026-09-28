const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');

// 1. Add import
if (!page.includes('generateInvoiceExpense')) {
  page = page.replace(
    /import \{ getItemsByCategory, submitExpense \} from '@\/app\/actions\/rab'/,
    "import { getItemsByCategory, submitExpense } from '@/app/actions/rab'\nimport { generateKwitansiExpense, generateInvoiceExpense } from '@/app/actions/rekap'"
  );
  // Also wait, `generateKwitansiExpense` was already imported?
  // Let's check imports.
}

// 2. Add state
page = page.replace(
  /const \[inputNoUrut, setInputNoUrut\] = useState\(""\)\n\s*const \[inputTanggal, setInputTanggal\] = useState\(""\)/,
  `const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputTanggal, setInputTanggal] = useState("")
  const [inputInvoiceNoUrut, setInputInvoiceNoUrut] = useState("")
  const [inputInvoiceTanggal, setInputInvoiceTanggal] = useState("")`
);

// 3. Update getInvoiceHtml
page = page.replace(
  /const getInvoiceHtml = \(expense: any, kopType: string\) => \{/,
  "const getInvoiceHtml = (expense: any, record: any, kopType: string) => {"
);
page = page.replace(
  /<p><strong>Tanggal Diajukan:<\/strong> \$\{new Date\(expense\.createdAt\)\.toLocaleDateString\('id-ID'\)\}<\/p>/,
  `<p><strong>No Invoice:</strong> \${record?.noInvoice || '-'}</p>
            <p><strong>Tanggal Invoice:</strong> \${record?.tanggal ? new Date(record.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(expense.createdAt).toLocaleDateString('id-ID')}</p>`
);

// 4. Update handlePrint
page = page.replace(
  /if \(printInvoice\) \{\s*htmlString \+= getInvoiceHtml\(submittedExpense, selectedKop\);\s*\}/,
  `if (printInvoice) {
        const invRecord = await generateInvoiceExpense(submittedExpense.id, inputInvoiceNoUrut, inputInvoiceTanggal);
        htmlString += getInvoiceHtml(submittedExpense, invRecord, selectedKop);
      }`
);

// 5. Update UI to add inputs
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
                        placeholder="Kosongkan untuk otomatis"
                        className="w-full border rounded p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Invoice</label>
                      <input 
                        type="date" 
                        value={inputInvoiceTanggal}
                        onChange={(e) => setInputInvoiceTanggal(e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}`
);

fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', page);
console.log('Fixed pengeluaran form');
