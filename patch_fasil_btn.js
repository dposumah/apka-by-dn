const fs = require('fs');
const filePath = 'src/app/(snt)/fasilitator/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /<Link href=\{`\/fasilitator\/\$\{f\.id\}`\} className="text-sm font-medium text-blue-600 hover:underline">\s*Lihat Profil &rarr;\s*<\/Link>/;

const replacement = `<Link href={\`/fasilitator/\${f.id}\`} className="text-sm font-medium text-blue-600 hover:underline">
                        Lihat Profil &rarr;
                      </Link>
                      <div className="mt-2">
                        <DeleteFasilButton id={f.id} />
                      </div>`;

code = code.replace(regex, replacement);
fs.writeFileSync(filePath, code);
