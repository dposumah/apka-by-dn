const fs = require('fs');

const rabPath = 'src/app/actions/rab.ts';
let rabContent = fs.readFileSync(rabPath, 'utf8');

// The block to remove is exactly from "// Recalculate pending transport darat if besaranTransport changed" down to "return newFasilitator" inside `createFasilitator`.
// Since we are in `createFasilitator`, it's followed by:
// `  revalidatePath('/fasilitator')`
// `  return newFasilitator`
// `}`

const badBlockRegex = /\/\/ Recalculate pending transport darat if besaranTransport changed[\s\S]*?(?=revalidatePath\('\/fasilitator'\))/;

rabContent = rabContent.replace(badBlockRegex, '');

// Don't forget to add ktpUrl back safely.
if (!rabContent.includes('ktpUrl: data.ktpUrl || null,')) {
  rabContent = rabContent.replace(
    /lokasiSNT: data.lokasiSNT \|\| null,/,
    'lokasiSNT: data.lokasiSNT || null,\n      ktpUrl: data.ktpUrl || null,'
  );
}
// And updateFasilitatorProfile
if (!rabContent.includes('ktpUrl: data.ktpUrl !== undefined ? data.ktpUrl : undefined,')) {
  rabContent = rabContent.replace(
    /lokasiSNT: data.lokasiSNT \|\| null,/,
    'lokasiSNT: data.lokasiSNT || null,\n      ktpUrl: data.ktpUrl !== undefined ? data.ktpUrl : undefined,'
  );
}

fs.writeFileSync(rabPath, rabContent);
console.log('Fixed rab.ts completely');
