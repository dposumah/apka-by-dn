const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8')

// Remove all occurrences of imports first
code = code.replace(/import \{ prisma \} from '@\/lib\/prisma';/g, '')
code = code.replace(/import \{ revalidatePath \} from 'next\/cache';/g, '')

// Add them back at the top under use server
code = code.replace(
  '"use server";',
  `"use server";\n\nimport { prisma } from '@/lib/prisma';\nimport { revalidatePath } from 'next/cache';`
)

fs.writeFileSync('src/app/actions/rekap.ts', code)
