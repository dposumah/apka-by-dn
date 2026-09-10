const fs = require('fs');

const rabPath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(rabPath, 'utf8');

if (!code.includes('getAdminNotificationEmailHtml')) {
  // Add imports
  code = code.replace(
    "import { checkAuth } from '@/lib/auth-check'",
    "import { checkAuth } from '@/lib/auth-check'\nimport { sendEmail } from '@/lib/email'\nimport { getAdminNotificationEmailHtml } from '@/lib/email-templates'"
  );

  // Inject email sending logic at the end of submitLaporanKegiatan
  // The function usually ends with:
  // revalidatePath('/portal/laporan');
  // revalidatePath('/portal/rekap');
  // return laporan;
  const injectLogic = `
  // -- EMAIL NOTIFICATION TO ADMIN --
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { email: true }
    });
    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

    if (adminEmails.length > 0) {
      const dateStr = new Date(laporan.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const hasTransport = (laporan.biayaTransport > 0) || (laporan.biayaTransportLaut > 0);
      const transportTotal = (laporan.biayaTransport || 0) + (laporan.biayaTransportLaut || 0);

      // We can send emails sequentially or all at once. Resend allows up to 50 'to' addresses per batch, 
      // but it's often safer to send them one by one if there are only a few admins.
      for (const email of adminEmails) {
        await sendEmail({
          to: email,
          subject: '🚨 Laporan Baru: ' + fasil?.namaLengkap,
          html: getAdminNotificationEmailHtml(fasil?.namaLengkap || 'Fasilitator', dateStr, laporan.topic, hasTransport, transportTotal)
        });
      }
    }
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
  // -- END EMAIL NOTIFICATION --

  revalidatePath('/portal/laporan');`;

  code = code.replace("  revalidatePath('/portal/laporan')", injectLogic);
  
  fs.writeFileSync(rabPath, code);
  console.log('Injected admin notification into rab.ts');
}
