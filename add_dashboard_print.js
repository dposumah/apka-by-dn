const fs = require('fs');

function addPrintDokumen(file) {
  let c = fs.readFileSync(file, 'utf8');

  // Add handlePrintDokumen right after handlePrint
  const handlePrintRegex = /const handlePrint = async \(\) => \{[\s\S]*?setIsGeneratingPdf\(false\);\n\s*\}\n\s*\};/;
  
  const handlePrintOut = `
  const handlePrintDokumen = async () => {
    if (!selectedExpense) return;
    setIsGeneratingPdf(true);
    try {
      let htmlString = "";
      if (printInvoice) {
        htmlString += getInvoiceHtml(selectedExpense, selectedKop);
      }
      if (printKwitansi) {
        const record = await generateKwitansiExpense(selectedExpense.id, inputNoUrut, inputTanggal);
        htmlString += getKwitansiHtml(selectedExpense, record);
      }
      
      if (!htmlString) return;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Popup diblokir! Izinkan popup untuk memprint.");
        return;
      }
      
      printWindow.document.write(\`
        <html>
          <head>
            <title>Print Dokumen</title>
            <style>
              @media print {
                body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0;">
            \${htmlString}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      \`);
      printWindow.document.close();
      setShowPrintModal(false);
    } catch (err: any) {
      console.error('PRINT ERROR', err);
      alert("Gagal print: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  `;

  // We need to inject handlePrintDokumen after handlePrint
  c = c.replace(handlePrintRegex, (match) => {
    // Add pagebreak to opt in handlePrint
    let modifiedMatch = match.replace(/jsPDF: \{ unit: 'mm', format: 'a4', orientation: 'portrait' \}/, "jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },\n        pagebreak: { mode: 'css' }");
    return modifiedMatch + '\n' + handlePrintOut;
  });

  // Now replace the buttons
  const buttonGroupRegex = /<button \s*onClick=\{handlePrint\}[\s\S]*?<\/button>/;
  const newButtons = `<div className="flex gap-2 mt-4">
                  <button 
                    onClick={handlePrint}
                    disabled={!printInvoice && !printKwitansi || isGeneratingPdf}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
                  >
                    {isGeneratingPdf ? 'Memproses...' : 'Export PDF'}
                  </button>
                  <button 
                    onClick={handlePrintDokumen}
                    disabled={!printInvoice && !printKwitansi || isGeneratingPdf}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
                  >
                    {isGeneratingPdf ? 'Memproses...' : 'Print Dokumen'}
                  </button>
                </div>`;
  c = c.replace(buttonGroupRegex, newButtons);
  
  fs.writeFileSync(file, c);
}

addPrintDokumen('src/app/(snt)/dashboard-rab/client-page.tsx');
addPrintDokumen('src/app/(snt)/pengeluaran/form.tsx');
