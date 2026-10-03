const fs = require('fs');
let layout = fs.readFileSync('src/components/layout/MainLayout.tsx', 'utf8');

layout = layout.replace(
  /<div className="hidden md:block">/,
  '<div className="hidden md:block print:hidden">'
);
layout = layout.replace(
  /<div className=\{\`fixed inset-y-0/,
  '<div className={`print:hidden fixed inset-y-0'
);
layout = layout.replace(
  /<Header onMenuClick=\{\(\) => setIsMobileMenuOpen\(true\)\} \/>/,
  '<div className="print:hidden"><Header onMenuClick={() => setIsMobileMenuOpen(true)} /></div>'
);

fs.writeFileSync('src/components/layout/MainLayout.tsx', layout);
console.log('Fixed MainLayout print:hidden');
