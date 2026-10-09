const fs = require('fs');
const rekapPath = 'src/app/actions/rekap.ts';
let content = fs.readFileSync(rekapPath, 'utf8');

const newAction = `
export async function updateTargetJpFasilitator(id: string, targetBulan: number, targetTotal: number) {
  await prisma.fasilitator.update({
    where: { id },
    data: {
      targetJPBulan: targetBulan,
      targetJPTotal: targetTotal
    }
  })
}
`;

if (!content.includes('updateTargetJpFasilitator')) {
  content += newAction;
  fs.writeFileSync(rekapPath, content);
  console.log('Added updateTargetJpFasilitator');
}
