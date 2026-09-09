const fs = require('fs');

function replaceInFile(filePath, searchStr, replaceStr) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replaceAll(searchStr, replaceStr);
  fs.writeFileSync(filePath, code);
  console.log(`Updated ${filePath}`);
}

replaceInFile('src/app/(auth)/login/page.tsx', 'PT. JTR Explorer', 'PT. JT Robotic Explorer');
replaceInFile('src/app/(snt)/sidebar.tsx', 'PT. JT Robotic', 'PT. JT Robotic Explorer');
replaceInFile('src/app/(snt)/portal/client-page.tsx', 'PT. JT Robotic', 'PT. JT Robotic Explorer');

