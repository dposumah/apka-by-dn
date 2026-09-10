const fs = require('fs');
const rekapPath = 'src/app/actions/rekap.ts';
if (fs.existsSync(rekapPath)) {
  let code = fs.readFileSync(rekapPath, 'utf8');
  code = code.replace("import { sendEmail } from '@/lib/email';\nimport { getTransportLunasEmailHtml, getHonorLunasEmailHtml } from '@/lib/email-templates';\n\"use server\";\n", "\"use server\";\nimport { sendEmail } from '@/lib/email';\nimport { getTransportLunasEmailHtml, getHonorLunasEmailHtml } from '@/lib/email-templates';\n");
  fs.writeFileSync(rekapPath, code);
  console.log('Fixed use server position');
}
