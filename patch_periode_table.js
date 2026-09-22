const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/akomodasi/client-page.tsx', 'utf8');

const tableHtmlOld = `
          <table>
            <thead>
              <tr>
                <th>Bulan ke-</th>
                <th>Periode</th>
                <th>Nominal (Rp)</th>
                <th>Paraf Penerima</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td></td><td>\\$\{(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
              <tr><td>2</td><td></td><td>\\$\{(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
              <tr><td>3</td><td></td><td>\\$\{(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
              <tr><td>4</td><td></td><td>\\$\{(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
            </tbody>
          </table>
`;

const parsingLogic = `
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    let startMonthIdx = -1;
    let year = d.getFullYear();
    
    if (item.periodeSewa) {
      const words = item.periodeSewa.split(/[\\s-]+/);
      for (const w of words) {
        const idx = monthNames.findIndex(m => m.toLowerCase() === w.toLowerCase());
        if (idx !== -1 && startMonthIdx === -1) startMonthIdx = idx;
        if (w.match(/^20\\d{2}$/)) year = parseInt(w);
      }
    }
    
    const getBulan = (offset: number) => {
      if (startMonthIdx === -1) return '';
      const m = (startMonthIdx + offset) % 12;
      const y = year + Math.floor((startMonthIdx + offset) / 12);
      return \`\${monthNames[m]} \${y}\`;
    };
    
    win.document.write(\`
`;

const tableHtmlNew = `
          <table>
            <thead>
              <tr>
                <th>Bulan ke-</th>
                <th>Periode</th>
                <th>Nominal (Rp)</th>
                <th>Paraf Penerima</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>\${getBulan(0)}</td><td>\${(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
              <tr><td>2</td><td>\${getBulan(1)}</td><td>\${(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
              <tr><td>3</td><td>\${getBulan(2)}</td><td>\${(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
              <tr><td>4</td><td>\${getBulan(3)}</td><td>\${(item.hargaSewaBulan || 0).toLocaleString('id-ID')}</td><td></td></tr>
            </tbody>
          </table>
`;

// Insert parsing logic before win.document.write
code = code.replace("    win.document.write(\`", parsingLogic);

// Replace old table with new table
code = code.replace(/<table>[\s\S]*?<\/table>/m, tableHtmlNew.trim());

fs.writeFileSync('src/app/(snt)/fasilitator/akomodasi/client-page.tsx', code);
console.log('Periode table fixed');
