const fs = require('fs');

const rekapPath = 'src/app/actions/rekap.ts';
let code = fs.readFileSync(rekapPath, 'utf8');

// Inject imports if not exist
if (!code.includes('sendEmail')) {
  code = "import { sendEmail } from '@/lib/email';\nimport { getTransportLunasEmailHtml, getHonorLunasEmailHtml } from '@/lib/email-templates';\n" + code;
}

// 1. markTransportPaid
// Inside markTransportPaid, it fetches the updated `lap` which might not include `fasilitator.email`. We need to fetch it.
const markRegex = /(const lap = await prisma\.laporanKegiatan\.update\(\{\s*where: \{ id: laporanId \},\s*data: \{[\s\S]*?\}\s*\}\);)/;
if (code.includes('statusTransport: \'PAID\'') && !code.includes('sendEmail({')) {
  // Let's replace the whole function content using a more robust replacement
  code = code.replace(
    "export async function markTransportPaid(laporanId: string, buktiUrl: string) {\n  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']);\n  if (authError || !session?.user?.id) throw new Error('Unauthorized');\n  const userId = session.user.id;\n\n  const lap = await prisma.laporanKegiatan.update({\n    where: { id: laporanId },\n    data: { \n      statusTransport: 'PAID',\n      buktiTransferTransport: buktiUrl \n    }\n  });\n\n  const rabItem = await prisma.rabItem.findFirst({",
    "export async function markTransportPaid(laporanId: string, buktiUrl: string) {\n  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']);\n  if (authError || !session?.user?.id) throw new Error('Unauthorized');\n  const userId = session.user.id;\n\n  const lap = await prisma.laporanKegiatan.update({\n    where: { id: laporanId },\n    data: { \n      statusTransport: 'PAID',\n      buktiTransferTransport: buktiUrl \n    },\n    include: { fasilitator: true }\n  });\n\n  // Kirim Notifikasi Email\n  if (lap.fasilitator?.email) {\n    const dateStr = new Date(lap.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });\n    const totalAmount = (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0);\n    await sendEmail({\n      to: lap.fasilitator.email,\n      subject: '✅ Transportasi SNT Lunas - ' + dateStr,\n      html: getTransportLunasEmailHtml(lap.fasilitator.namaLengkap, dateStr, lap.topic, totalAmount, buktiUrl)\n    });\n  }\n\n  const rabItem = await prisma.rabItem.findFirst({"
  );
}

// 2. adminGenerateInvoiceHonor
// Currently: `const updated = await prisma.rekapHonorarium.update({ ... }); return updated;`
code = code.replace(
  "  const updated = await prisma.rekapHonorarium.update({\n    where: { id: rekapId },\n    data: {\n      status: 'APPROVED'\n    }\n  });\n\n  revalidatePath('/fasilitator/rekap-honor');\n  revalidatePath('/dashboard-rab');\n  return updated;\n}",
  "  const updated = await prisma.rekapHonorarium.update({\n    where: { id: rekapId },\n    data: {\n      status: 'APPROVED'\n    }\n  });\n\n  // Kirim Notifikasi Email\n  if (rekap.fasilitator?.email) {\n    await sendEmail({\n      to: rekap.fasilitator.email,\n      subject: '✅ Honorarium SNT Disetujui - Bulan ' + rekap.bulan,\n      html: getHonorLunasEmailHtml(rekap.fasilitator.namaLengkap, rekap.bulan, rekap.totalJP, rekap.totalHonor, rekap.filePdf || '#')\n    });\n  }\n\n  revalidatePath('/fasilitator/rekap-honor');\n  revalidatePath('/dashboard-rab');\n  return updated;\n}"
);

fs.writeFileSync(rekapPath, code);
console.log('Injected email notifications into rekap.ts');
