const fs = require('fs');
const filePath = 'src/app/(snt)/sidebar.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /<button\s*onClick=\{\(\) => signOut\(\{ callbackUrl: '\/login' \}\)\}\s*className="text-xs text-red-400 hover:underline cursor-pointer bg-transparent border-0 p-0 text-left"\s*>\s*Keluar\s*<\/button>/g;

const replacement = `<button
                  onClick={(e) => { e.preventDefault(); signOut({ callbackUrl: '/login' }) }}
                  onTouchEnd={(e) => { e.preventDefault(); signOut({ callbackUrl: '/login' }) }}
                  className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer bg-transparent border-0 p-2 -ml-2 text-left block w-full"
                >
                  Keluar
                </button>`;

code = code.replace(regex, replacement);
fs.writeFileSync(filePath, code);
