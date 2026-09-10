const fs = require('fs');
const filePath = 'src/app/(snt)/portal/client-page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add import
if (!code.includes('UploadLaporanFisikButton')) {
  code = code.replace(
    "import { useState } from 'react'",
    "import { useState } from 'react'\nimport { UploadLaporanFisikButton } from './upload-fisik-btn'"
  );
}

// Add the button
const target = `{lap.fileLaporanFisik && (
                        <a href={lap.fileLaporanFisik} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline mt-1 inline-block mr-3">
                          Laporan Fisik
                        </a>
                      )}`;
                      
const replacement = `{lap.fileLaporanFisik ? (
                        <a href={lap.fileLaporanFisik} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline mt-1 inline-block mr-3">
                          Laporan Fisik
                        </a>
                      ) : (
                        <UploadLaporanFisikButton laporanId={lap.id} />
                      )}`;

code = code.replace(target, replacement);

fs.writeFileSync(filePath, code);
console.log('Patched portal client-page');
