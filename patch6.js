const fs = require('fs');
const filePath = 'src/app/(snt)/sidebar.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  '<h1 className="text-[15px] font-bold text-white leading-tight tracking-wide">PT. JT Robotic<span className="block text-emerald-400 text-sm">Explorer</span></h1>\n                <p className="text-[11px] text-slate-400 truncate">KKA SNT 2026</p>',
  '<h1 className="text-sm font-bold text-white leading-snug break-words">PT. JT Robotic Explorer</h1>\n                <p className="text-[11px] text-slate-400">KKA SNT 2026</p>'
);

// We need to ensure the container flex allows wrapping instead of truncating.
code = code.replace(
  '<div className="min-w-0">',
  '<div className="min-w-0 flex-1">'
);

fs.writeFileSync(filePath, code);
console.log("Patched sidebar.tsx again");
