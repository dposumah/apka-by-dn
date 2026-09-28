const fs = require('fs');

function updateFile(file) {
  let c = fs.readFileSync(file, 'utf8');

  // Replace DOM container logic with simple wrapper
  const domLogic = /const container = document\.createElement\('div'\);[\s\S]*?await Promise\.all\(imagePromises\);/g;
  
  c = c.replace(domLogic, `const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlString;
        wrapper.style.width = '794px';
        wrapper.style.backgroundColor = '#ffffff';`);

  // Replace await html2pdf().set(opt).from(container).save();
  c = c.replace(/await html2pdf\(\)\.set\(opt\)\.from\(container\)\.save\(\);[\s\S]*?document\.body\.removeChild\(container\);/g, `await html2pdf().set(opt).from(wrapper).save();`);
  
  fs.writeFileSync(file, c);
}

updateFile('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx');
updateFile('src/app/(snt)/dashboard-rab/client-page.tsx');
updateFile('src/app/(snt)/pengeluaran/form.tsx');
