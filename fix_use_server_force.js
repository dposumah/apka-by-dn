const fs = require('fs');
const rekapPath = 'src/app/actions/rekap.ts';
if (fs.existsSync(rekapPath)) {
  let code = fs.readFileSync(rekapPath, 'utf8');
  // Remove all 'use server' variations
  code = code.replace(/"use server";\r?\n?/g, "");
  code = code.replace(/'use server';\r?\n?/g, "");
  code = code.replace(/"use server"\r?\n?/g, "");
  code = code.replace(/'use server'\r?\n?/g, "");
  // Remove existing email imports
  code = code.replace(/import \{ sendEmail \} from '@\/lib\/email';\r?\n?/g, "");
  code = code.replace(/import \{ getTransportLunasEmailHtml, getHonorLunasEmailHtml \} from '@\/lib\/email-templates';\r?\n?/g, "");

  // Add clean header
  const header = `"use server";\nimport { sendEmail } from '@/lib/email';\nimport { getTransportLunasEmailHtml, getHonorLunasEmailHtml } from '@/lib/email-templates';\n`;
  fs.writeFileSync(rekapPath, header + code);
  console.log('Force fixed use server');
}
