const fs = require('fs');

const formPath = 'src/app/(snt)/pengeluaran/form.tsx';
let formContent = fs.readFileSync(formPath, 'utf8');

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

formContent = formContent.replace(regex, replacement);
fs.writeFileSync(formPath, formContent);
console.log('Fixed form.tsx');
