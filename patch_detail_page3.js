const fs = require('fs');
const filePath = 'src/app/(snt)/fasilitator/[id]/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('CancelLunasButton')) {
  code = code.replace(
    "import { DeleteLaporanButton } from './delete-laporan-button'",
    "import { DeleteLaporanButton } from './delete-laporan-button'\nimport { CancelLunasButton } from './cancel-lunas-button'"
  );
  
  const target = "<DeleteLaporanButton laporanId={lap.id} fasilitatorId={f.id} />";
  const replacement = "<DeleteLaporanButton laporanId={lap.id} fasilitatorId={f.id} />\n                              {lap.statusTransport === 'PAID' && <CancelLunasButton laporanId={lap.id} />}";
  
  code = code.replace(target, replacement);
  fs.writeFileSync(filePath, code);
  console.log("Patched page.tsx for cancel lunas");
}
