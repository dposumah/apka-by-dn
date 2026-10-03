const fs = require('fs');

let layout = fs.readFileSync('src/app/(snt)/layout-client.tsx', 'utf8');

layout = layout.replace(
  /className=\{\`hidden md:block shrink-0 transition-all duration-300 ease-in-out \$\{/,
  'className={`hidden md:block print:hidden shrink-0 transition-all duration-300 ease-in-out ${'
);

layout = layout.replace(
  /\{header\}/,
  '<div className="print:hidden">{header}</div>'
);

fs.writeFileSync('src/app/(snt)/layout-client.tsx', layout);
console.log('Fixed SNT layout print:hidden');
