const fs = require('fs');
const filePath = 'src/app/(snt)/fasilitator/[id]/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('DeleteLaporanButton')) {
  code = code.replace(
    "import { DeleteFasilButton } from '../delete-fasil-button'",
    "import { DeleteFasilButton } from '../delete-fasil-button'\nimport { DeleteLaporanButton } from './delete-laporan-button'"
  );
  
  // Replace the action column for the report
  // Let's add it under the "Lampiran" or create a new column, or put it under Lampiran.
  // We'll put it under the "Lampiran" td.
  const targetTd = "{lap.buktiTiketTransport && <a href={lap.buktiTiketTransport} target=\"_blank\" className=\"text-emerald-600 font-bold hover:underline\">Tiket</a>}\n                              </div>\n                            </td>";
  
  const replacementTd = "{lap.buktiTiketTransport && <a href={lap.buktiTiketTransport} target=\"_blank\" className=\"text-emerald-600 font-bold hover:underline\">Tiket</a>}\n                              </div>\n                              <DeleteLaporanButton laporanId={lap.id} fasilitatorId={f.id} />\n                            </td>";
  
  code = code.replace(targetTd, replacementTd);
  fs.writeFileSync(filePath, code);
  console.log("Patched page.tsx");
}
