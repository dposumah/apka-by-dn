const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

// Change signature
file = file.replace(
  "export const getInvoiceHtml = (rekap: any, kopType: 'maleo' | 'robotic') => {",
  "export const getInvoiceHtml = (rekap: any, kopType: 'maleo' | 'robotic', invoiceRecord?: any) => {"
);

// Get noInvoice and Date
const invoiceHeaderLogic = `
  const noInvoiceStr = invoiceRecord ? invoiceRecord.noInvoice : '';
  const tanggalInvoice = invoiceRecord ? new Date(invoiceRecord.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '';
`;
file = file.replace(
  'const formatBulan = (bulan: string) => {',
  invoiceHeaderLogic + '\n  const formatBulan = (bulan: string) => {'
);

// Inject to Robotic
file = file.replace(
  '<h1 style="text-align: center; margin: 0; font-size: 24px; font-weight: 700; color: #000;">INVOICE HONORARIUM FASILITATOR</h1>',
  '<h1 style="text-align: center; margin: 0; font-size: 24px; font-weight: 700; color: #000;">INVOICE HONORARIUM FASILITATOR</h1>\n          ${noInvoiceStr ? `<div style="text-align: center; margin-top: 5px; font-size: 14px;"><strong>No Invoice:</strong> ${noInvoiceStr}</div>` : \'\'}\n          ${tanggalInvoice ? `<div style="text-align: center; margin-top: 5px; font-size: 14px;"><strong>Tanggal:</strong> ${tanggalInvoice}</div>` : \'\'}'
);

// Inject to Maleo
file = file.replace(
  '<h1 style="text-align: center; margin: 0; font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px;">INVOICE HONORARIUM</h1>',
  '<h1 style="text-align: center; margin: 0; font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px;">INVOICE HONORARIUM</h1>\n              ${noInvoiceStr ? `<div style="text-align: center; margin-top: 5px; font-size: 14px; color: #475569;"><strong>No Invoice:</strong> ${noInvoiceStr}</div>` : \'\'}\n              ${tanggalInvoice ? `<div style="text-align: center; margin-top: 5px; font-size: 14px; color: #475569;"><strong>Tanggal:</strong> ${tanggalInvoice}</div>` : \'\'}'
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', file);
