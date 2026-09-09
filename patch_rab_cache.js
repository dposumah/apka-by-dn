const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "revalidatePath('/portal')\n    revalidatePath('/dashboard-rab')",
  "revalidatePath('/', 'layout')"
);

code = code.replace(
  "revalidatePath('/dashboard-rab')\n    revalidatePath('/pengeluaran')",
  "revalidatePath('/', 'layout')"
);

code = code.replace(
  "revalidatePath('/fasilitator')",
  "revalidatePath('/', 'layout')"
);

fs.writeFileSync(filePath, code);
console.log("Patched rab.ts revalidations");
