const fs = require('fs');

let layout = fs.readFileSync('src/app/(snt)/layout-client.tsx', 'utf8');

layout = layout.replace(
  /className="flex h-screen w-full bg-slate-50"/,
  'className="flex h-screen print:h-auto w-full bg-slate-50 print:bg-white"'
);

layout = layout.replace(
  /className="flex-1 overflow-auto flex flex-col"/,
  'className="flex-1 overflow-auto print:overflow-visible flex flex-col"'
);

layout = layout.replace(
  /className="flex-1 overflow-auto"/,
  'className="flex-1 overflow-auto print:overflow-visible"'
);

fs.writeFileSync('src/app/(snt)/layout-client.tsx', layout);
console.log('Fixed SNT layout print overflow issues');
