const fs = require('fs')

let code = fs.readFileSync('src/lib/auth.ts', 'utf8')

code = code.replace(
  `        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Kredensial tidak valid");
        }`,
  `        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Kredensial tidak valid");
        }
        
        if (user.isActive === false) {
          throw new Error("Akun ini telah dinonaktifkan. Silakan hubungi Administrator.");
        }`
)

fs.writeFileSync('src/lib/auth.ts', code)
