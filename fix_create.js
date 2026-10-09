const fs = require('fs');

const rabPath = 'src/app/actions/rab.ts';
let rabContent = fs.readFileSync(rabPath, 'utf8');

const regex = /\/\/ Recalculate pending transport darat if besaranTransport changed[\s\S]*?if \(currentFasil && updated\.besaranTransport !== currentFasil\.besaranTransport\) \{[\s\S]*?\}[\s\S]*?\}/;

// The issue is `if (currentFasil && updated.besaranTransport !== currentFasil.besaranTransport) { ... }` is duplicated.
// It should only be after `const updated = await prisma.fasilitator.update({ ... })`.
// The one after `const newFasilitator = await prisma.fasilitator.create({ ... })` is wrong.

// Let's replace only the first occurrence (which is in createFasilitator).
let count = 0;
rabContent = rabContent.replace(regex, (match) => {
  count++;
  if (count === 1) {
    return ''; // Remove it
  }
  return match; // Keep the second one
});

fs.writeFileSync(rabPath, rabContent);
console.log('Fixed createFasilitator');
