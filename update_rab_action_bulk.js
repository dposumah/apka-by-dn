const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

const newAction = `
export async function updateBulkFasilitatorTransportSettings(data: { id: string, jarakPPKm: number, besaranTransport: number }[]) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) throw new Error(authError);

  for (const item of data) {
    await prisma.fasilitator.update({
      where: { id: item.id },
      data: {
        jarakPPKm: item.jarakPPKm,
        besaranTransport: item.besaranTransport
      }
    });
  }
  revalidatePath('/snt-akun');
}
`;

if (!code.includes('updateBulkFasilitatorTransportSettings')) {
  code += newAction;
  fs.writeFileSync('src/app/actions/rab.ts', code);
}
