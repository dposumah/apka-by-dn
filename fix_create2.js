const fs = require('fs');

const rabPath = 'src/app/actions/rab.ts';
let rabContent = fs.readFileSync(rabPath, 'utf8');

const regex = /\/\/ Recalculate pending transport darat if besaranTransport changed[\s\S]*?revalidatePath\('\/fasilitator'\)\n  return newFasilitator\n\}/;

rabContent = rabContent.replace(regex, `revalidatePath('/fasilitator')\n  return newFasilitator\n}`);

fs.writeFileSync(rabPath, rabContent);
console.log('Fixed createFasilitator cleanly');
