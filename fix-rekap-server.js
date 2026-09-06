const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8')

// Ensure "use server" at top
if (!code.includes('"use server"')) {
  code = '"use server";\n\n' + code;
}

// Remove duplicate imports
code = code.replace("import { prisma } from '@/lib/prisma';\r\nimport { revalidatePath } from 'next/cache';", "");
code = code.replace("import { prisma } from '@/lib/prisma';\nimport { revalidatePath } from 'next/cache';", "");

fs.writeFileSync('src/app/actions/rekap.ts', code)
