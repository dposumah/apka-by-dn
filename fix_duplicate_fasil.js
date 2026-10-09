const fs = require('fs');

const rabPath = 'src/app/actions/rab.ts';
let content = fs.readFileSync(rabPath, 'utf8');

// The file currently has:
//   const currentFasil = await prisma.fasilitator.findUnique({ where: { id } });
//   
//   // Security Check: Only ADMIN/SUPER_ADMIN or the fasilitator themselves can update their profile
//   if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
//     if (currentFasil?.userId !== session.user.id) {
//       throw new Error('Unauthorized: Anda tidak memiliki akses untuk mengubah profil fasilitator lain.');
//     }
//   }
// 
//   const currentFasil = await prisma.fasilitator.findUnique({ where: { id } })

content = content.replace(/  const currentFasil = await prisma\.fasilitator\.findUnique\(\{ where: \{ id \} \}\)\r?\n  let userId = currentFasil\?\.userId \|\| null/g, "  let userId = currentFasil?.userId || null");

fs.writeFileSync(rabPath, content);
console.log('Fixed currentFasil duplicate');
