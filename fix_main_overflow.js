const fs = require('fs');
let layout = fs.readFileSync('src/components/layout/MainLayout.tsx', 'utf8');

layout = layout.replace(
  /className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900"/,
  'className="flex h-screen print:h-auto w-full overflow-hidden print:overflow-visible bg-gray-50 print:bg-white text-gray-900"'
);

layout = layout.replace(
  /className="flex flex-1 flex-col overflow-hidden min-w-0"/,
  'className="flex flex-1 flex-col overflow-hidden print:overflow-visible min-w-0"'
);

layout = layout.replace(
  /className="flex-1 overflow-y-auto p-4 md:p-6"/,
  'className="flex-1 overflow-y-auto print:overflow-visible p-4 md:p-6 print:p-0"'
);

fs.writeFileSync('src/components/layout/MainLayout.tsx', layout);
console.log('Fixed MainLayout print overflow');
