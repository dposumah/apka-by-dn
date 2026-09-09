const fs = require('fs');
const filePath = 'src/app/(snt)/sidebar.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  '<h1 className="text-base font-bold text-white tracking-wide leading-tight truncate">PT. JT Robotic Explorer</h1>',
  '<h1 className="text-[15px] font-bold text-white leading-tight tracking-wide">PT. JT Robotic<span className="block text-emerald-400 text-sm">Explorer</span></h1>'
);

fs.writeFileSync(filePath, code);
console.log("Patched sidebar.tsx");
