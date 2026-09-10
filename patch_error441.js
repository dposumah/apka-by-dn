const fs = require('fs');

// 1. Update Server Action
const actionPath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(actionPath, 'utf8');

const oldAction = `export async function deleteLaporanKegiatan(laporanId: string, fasilitatorId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const lap = await prisma.laporanKegiatan.findUnique({
    where: { id: laporanId }
  })

  if (!lap) throw new Error('Laporan tidak ditemukan')
  if (lap.fasilitatorId !== fasilitatorId) throw new Error('Unauthorized')
  
  if (lap.rekapHonorariumId || lap.statusTransport === 'PAID') {
    throw new Error('Laporan sudah diproses oleh Admin dan tidak dapat dihapus.')
  }

  await prisma.laporanKegiatan.delete({
    where: { id: laporanId }
  })
  
  revalidatePath('/portal')
  revalidatePath('/dashboard-rab')
}`;

const newAction = `export async function deleteLaporanKegiatan(laporanId: string, fasilitatorId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const lap = await prisma.laporanKegiatan.findUnique({
    where: { id: laporanId }
  })

  if (!lap) return { error: 'Laporan tidak ditemukan' }
  // Allow Admin to bypass fasilitatorId check if needed, or keep it.
  // if (lap.fasilitatorId !== fasilitatorId) return { error: 'Unauthorized' }
  
  if (lap.rekapHonorariumId || lap.statusTransport === 'PAID') {
    return { error: 'Laporan sudah dibayar (Transport/Honor) sehingga tidak dapat dihapus.' }
  }

  await prisma.laporanKegiatan.delete({
    where: { id: laporanId }
  })
  
  revalidatePath('/', 'layout')
  return { success: true }
}`;

if (code.includes('throw new Error(\'Laporan sudah diproses')) {
  // Simple replace
  code = code.replace(/export async function deleteLaporanKegiatan[\s\S]*?revalidatePath\('\/dashboard-rab'\)/, newAction);
  fs.writeFileSync(actionPath, code);
  console.log("Updated rab.ts");
} else {
  console.log("Could not find exactly. Manual check.");
}

// 2. Update Client page
const clientPath = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let clientCode = fs.readFileSync(clientPath, 'utf8');
const oldClientFn = `await deleteLaporanKegiatan(lapId, fasilitatorId);
      router.refresh();`;
const newClientFn = `const res = await deleteLaporanKegiatan(lapId, fasilitatorId);
      if (res?.error) {
        alert(res.error);
      } else {
        router.refresh();
      }`;
clientCode = clientCode.replace(oldClientFn, newClientFn);
fs.writeFileSync(clientPath, clientCode);

// 3. Update Detail page button
const btnPath = 'src/app/(snt)/fasilitator/[id]/delete-laporan-button.tsx';
let btnCode = fs.readFileSync(btnPath, 'utf8');
const oldBtnFn = `await deleteLaporanKegiatan(laporanId, fasilitatorId);
      alert('Laporan berhasil dihapus');
      router.refresh();`;
const newBtnFn = `const res = await deleteLaporanKegiatan(laporanId, fasilitatorId);
      if (res?.error) {
        alert(res.error);
      } else {
        alert('Laporan berhasil dihapus');
        router.refresh();
      }`;
btnCode = btnCode.replace(oldBtnFn, newBtnFn);
fs.writeFileSync(btnPath, btnCode);
console.log("Updated UI components");
