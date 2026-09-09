const fs = require('fs');

function moveInfo(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  const infoBlockRegex = /<div style="text-align: right; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc;">\s*<h4 style="margin:0 0 10px 0;">Informasi Transfer<\/h4>\s*<p style="margin:5px 0;"><strong>Bank:<\/strong> \$\{([a-zA-Z0-9_.]+)\.bankName \|\| '-'\}.*?\s*<p style="margin:5px 0;"><strong>No\. Rekening:<\/strong> \$\{([a-zA-Z0-9_.]+)\.bankAccount \|\| '-'\}.*?\s*<p style="margin:5px 0;"><strong>A\/N:<\/strong> \$\{([a-zA-Z0-9_.]+)\.namaLengkap\}.*?\s*<\/div>/s;
  
  const match = code.match(infoBlockRegex);
  if (!match) {
    console.log("Could not find info block in", filePath);
    return;
  }
  
  const infoBlock = match[0];
  const objName = match[1]; // lap.fasilitator or rekap.fasilitator
  
  // Remove the info block from top
  code = code.replace(infoBlock, '');
  
  // Add it to the bottom
  const newBottom = `</table>
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc; min-width: 250px;">
              <h4 style="margin:0 0 10px 0;">Informasi Transfer</h4>
              <p style="margin:5px 0;"><strong>Bank:</strong> \${${objName}.bankName || '-'}</p>
              <p style="margin:5px 0;"><strong>No. Rekening:</strong> \${${objName}.bankAccount || '-'}</p>
              <p style="margin:5px 0;"><strong>A/N:</strong> \${${objName}.namaLengkap}</p>
            </div>
            <div style="text-align:right;">
              <p style="margin-top:40px;">Dicetak oleh: Admin SNT</p>
            </div>
          </div>`;
          
  code = code.replace(/<\/table>\s*<p style="margin-top:40px; text-align:right;">Dicetak oleh: Admin SNT<\/p>/s, newBottom);
  
  fs.writeFileSync(filePath, code);
  console.log("Patched", filePath);
}

moveInfo('src/app/(snt)/fasilitator/laporan/client-page.tsx');
moveInfo('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx');

