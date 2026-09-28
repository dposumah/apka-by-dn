const fs = require('fs');
let content = fs.readFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', 'utf8');

const replacement = `  const handlePrintDokumen = async () => {
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
      
      if (!htmlString) {
        setIsGeneratingPdf(false);
        setShowPrintModal(false);
        return;
      }
      
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(htmlString);
        win.document.close();
      }
    } catch (err: any) {
      console.error('GENERATE PDF ERROR', err);
      alert("Gagal print: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = async () => {`;

content = content.replace(/const handlePrint = async \(\) => \{/, replacement);

fs.writeFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', content);
console.log('Fixed handlePrintDokumen');
