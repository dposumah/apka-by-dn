const fs = require('fs');

const path = 'src/app/(snt)/dashboard-rab/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const wrapper = document\.createElement\('div'\);[\s\S]*?await html2pdf\(\)\.set\(opt\)\.from\(wrapper\)\.save\(\);/;

const replacement = `
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(htmlString);
          win.document.close();
          setTimeout(() => {
            win.print();
          }, 1000);
        }
`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('Fixed dashboard-rab/client-page.tsx');
