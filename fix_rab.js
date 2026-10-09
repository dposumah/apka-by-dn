const fs = require('fs');

const rabPath = 'src/app/actions/rab.ts';
let rabContent = fs.readFileSync(rabPath, 'utf8');

// The field is added inside the `data: { ... }` block of `prisma.fasilitator.create` and `prisma.fasilitator.update`
// We can use a more precise regex.

rabContent = rabContent.replace(
  /lokasiSNT: data.lokasiSNT \|\| null,/g,
  'lokasiSNT: data.lokasiSNT || null,\n        ktpUrl: data.ktpUrl !== undefined ? data.ktpUrl : undefined,'
);

fs.writeFileSync(rabPath, rabContent);
console.log('Fixed rab.ts');
