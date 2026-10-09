const fs = require('fs');

function fixPrintLogic(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove crossorigin="anonymous"
  content = content.replace(/crossorigin="anonymous"/g, '');

  if (filePath.includes('form.tsx')) {
    // Replace html2pdf logic with window.open in form.tsx
    const oldPrintLogic = `const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlString;
        wrapper.style.width = '794px';
        wrapper.style.backgroundColor = '#ffffff';
      
      let html2pdf: any; try { html2pdf = require('html2pdf.js'); } catch (e) { html2pdf = (window as any).html2pdf; }
      const opt = {
        margin: 0,
        filename: 'Pengeluaran_' + submittedExpense.rabItem.name.replace(/\\s+/g, '_') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(wrapper).save();`;

    const newPrintLogic = `
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(htmlString);
          win.document.close();
          // Give images a moment to load before printing
          setTimeout(() => {
            win.print();
          }, 1000);
        }`;

    content = content.replace(oldPrintLogic, newPrintLogic);
  }

  if (filePath.includes('dashboard-rab/client-page.tsx')) {
    // Also add setTimeout to dashboard-rab window.print to ensure images load
    const oldWinPrint = `const win = window.open('', '_blank');
      if (win) {
        win.document.write(htmlString);
        win.document.close();
        win.onload = () => {
          win.print();
        };
      }`;
    
    const newWinPrint = `const win = window.open('', '_blank');
      if (win) {
        win.document.write(htmlString);
        win.document.close();
        setTimeout(() => {
          win.print();
        }, 1000);
      }`;

    content = content.replace(oldWinPrint, newWinPrint);
  }

  fs.writeFileSync(filePath, content);
  console.log('Fixed ' + filePath);
}

fixPrintLogic('src/app/(snt)/pengeluaran/form.tsx');
fixPrintLogic('src/app/(snt)/dashboard-rab/client-page.tsx');
