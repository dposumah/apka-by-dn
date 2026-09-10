const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace("  return { success: true }\n}\n}\n\nexport async function deleteExpense", "  return { success: true }\n}\n\nexport async function deleteExpense");
fs.writeFileSync(filePath, code);
console.log("Fixed syntax error");
