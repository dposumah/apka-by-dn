const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/}\r?\n}\r?\n\r?\nexport async function deleteExpense/, "}\n\nexport async function deleteExpense");
fs.writeFileSync(filePath, code);
console.log("Fixed syntax error using regex");
