const fs = require('fs');
let c = fs.readFileSync('src/app/actions/rab.ts', 'utf8');
const parts = c.split('// Recalculate pending transport darat if besaranTransport changed');
if (parts.length > 2) {
  const p1 = parts[0];
  const p2 = parts[1];
  const p3 = parts[2];
  
  const revIndex = p2.indexOf("revalidatePath('/fasilitator')");
  const p2fixed = p2.substring(revIndex);
  
  fs.writeFileSync('src/app/actions/rab.ts', p1 + p2fixed + '// Recalculate pending transport darat if besaranTransport changed' + p3);
  console.log('Fixed manually');
}
