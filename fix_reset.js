const fs = require('fs');

let content = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');
content = content.replace(
  /const handleSubmit = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\)\s*setLoading\(true\)/,
  `const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formElement = e.currentTarget
    setLoading(true)`
);

content = content.replace(
  /e\.currentTarget\.reset\(\)/g,
  `formElement.reset()`
);

fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', content);
console.log('Fixed reset bug');
