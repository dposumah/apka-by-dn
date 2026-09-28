const fs = require('fs');
let content = fs.readFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', 'utf8');

content = content.replace(
  /win\.document\.close\(\);\s*\}/,
  `win.document.close();
        win.onload = () => {
          win.print();
        };
      }`
);

fs.writeFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', content);
console.log('Added print script');
