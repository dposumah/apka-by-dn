const fs = require('fs');

let c = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// Replace the buttons
const buttonsRegex = /<button \s*onClick=\{generatePdfDirect\}[\s\S]*?<\/button>/;
const newButtons = `<button 
                  onClick={generatePdfDirect}
                  disabled={isGeneratingPdf || (!printCheckInvoice && !printCheckHonor && !printCheckTransport)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGeneratingPdf ? 'Memproses...' : 'Export PDF'}
                </button>
                <button 
                  onClick={async () => {
                    if (!selectedRekap) return;
                    setIsGeneratingPdf(true);
                    try {
                      let htmlString = "";
                      
                      if (printCheckInvoice) {
                        htmlString += getInvoiceHtml(selectedRekap, printKopType);
                      }
                      
                      if (printCheckHonor) {
                        const record = await generateKwitansiHonor(selectedRekap.id, inputNoUrut, inputTanggal);
                        if (record.error) throw new Error(record.error);
                        htmlString += getKwitansiHtml(selectedRekap, record, 'HONOR', terbilangRupiah);
                      }
                      
                      let transportNoUrut = inputNoUrut;
                      if (printCheckHonor && printCheckTransport && inputNoUrut) {
                        const num = parseInt(inputNoUrut, 10);
                        if (!isNaN(num)) transportNoUrut = (num + 1).toString();
                        else transportNoUrut = inputNoUrut + "-T";
                      }
                      
                      if (printCheckTransport) {
                        const record = await generateKwitansiTransportBulanan(selectedRekap.id, transportNoUrut, inputTanggal);
                        if (record.error) throw new Error(record.error);
                        htmlString += getKwitansiHtml(selectedRekap, record, 'TRANSPORT', terbilangRupiah);
                      }
                      
                      if (!htmlString) {
                        alert("Pilih minimal 1 dokumen untuk dicetak.");
                        setIsGeneratingPdf(false);
                        return;
                      }

                      const printWindow = window.open('', '_blank');
                      if (!printWindow) {
                        alert("Popup diblokir! Izinkan popup untuk memprint.");
                        setIsGeneratingPdf(false);
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
                                  // window.close(); // Optional: close after print
                                }, 500);
                              };
                            </script>
                          </body>
                        </html>
                      \`);
                      printWindow.document.close();
                      setShowKopModal(false);
                    } catch (err: any) {
                      console.error('GENERATE PRINT ERROR', err, err.stack);
                      alert("Gagal print: " + err.message);
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                  disabled={isGeneratingPdf || (!printCheckInvoice && !printCheckHonor && !printCheckTransport)}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 ml-2"
                >
                  {isGeneratingPdf ? 'Memproses...' : 'Print Dokumen'}
                </button>`;

c = c.replace(buttonsRegex, newButtons);

// Add pagebreak to html2pdf options
const optRegex = /const opt = \{[\s\S]*?jsPDF: \{ unit: 'mm', format: 'a4', orientation: 'portrait' \}\s*\};/;
const newOpt = `const opt = {
          margin: 0,
          filename: \`Rekap_Honor_\${selectedRekap.fasilitator?.namaLengkap}_\${selectedRekap.bulan}.pdf\`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: 'css' }
        };`;
c = c.replace(optRegex, newOpt);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', c);
