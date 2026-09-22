const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const newAction = `
export async function createRekapManual(fasilitatorId: string, bulan: string, totalJP: number, totalHonor: number) {
  const session = await getServerSession(authOptions);
  
  // Create RekapHonorarium directly with SUBMITTED status
  // so admin can generate invoice immediately.
  const rekap = await prisma.rekapHonorarium.create({
    data: {
      fasilitatorId,
      bulan,
      totalJP,
      totalHonor,
      status: 'SUBMITTED',
    }
  });

  revalidatePath('/fasilitator/rekap-honor');
  revalidatePath('/portal/rekap');
  return rekap;
}
`;

code = code + '\n' + newAction;
fs.writeFileSync('src/app/actions/rekap.ts', code);
console.log('Action created');
