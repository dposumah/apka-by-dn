const fs = require('fs');

const rekapPath = 'src/app/actions/rekap.ts';
let content = fs.readFileSync(rekapPath, 'utf8');

const newAction = `
export async function adminUpdateTransportAmount(laporanId: string, biayaTransport: number, biayaTransportLaut: number) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'KORWIL']);
  if (authError || !session) throw new Error(authError || "Unauthorized");

  const updated = await prisma.laporanKegiatan.update({
    where: { id: laporanId },
    data: {
      biayaTransport: parseFloat(biayaTransport.toString()) || 0,
      biayaTransportLaut: parseFloat(biayaTransportLaut.toString()) || 0,
    }
  });

  revalidatePath('/fasilitator/laporan');
  return updated;
}
`;

content = content + "\n" + newAction;
fs.writeFileSync(rekapPath, content);
console.log('Added adminUpdateTransportAmount to rekap.ts');
