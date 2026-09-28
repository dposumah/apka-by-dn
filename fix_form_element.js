const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');

page = page.replace(
  /async function handleSubmit\(e: React\.FormEvent<HTMLFormElement>\) \{\s*e\.preventDefault\(\)\s*setLoading\(true\)/,
  `async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {\n    e.preventDefault()\n    const formElement = e.currentTarget;\n    setLoading(true)`
);

fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', page);
console.log('Fixed formElement');
