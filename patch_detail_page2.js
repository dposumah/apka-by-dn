const fs = require('fs');
const filePath = 'src/app/(snt)/fasilitator/[id]/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('DeleteLaporanButton')) {
  code = code.replace(
    "import { DeleteFasilButton } from '../delete-fasil-button'",
    "import { DeleteFasilButton } from '../delete-fasil-button'\nimport { DeleteLaporanButton } from './delete-laporan-button'"
  );
  
  const target = "{lap.foto2 && <a href={lap.foto2} target=\"_blank\" rel=\"noreferrer\" className=\"text-blue-600 hover:underline text-xs\">Foto 2</a>}\n                              </div>";
  const replacement = "{lap.foto2 && <a href={lap.foto2} target=\"_blank\" rel=\"noreferrer\" className=\"text-blue-600 hover:underline text-xs\">Foto 2</a>}\n                              </div>\n                              <DeleteLaporanButton laporanId={lap.id} fasilitatorId={f.id} />";
  
  code = code.replace(target, replacement);
  fs.writeFileSync(filePath, code);
  console.log("Patched page.tsx");
}
