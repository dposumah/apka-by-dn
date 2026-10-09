const fs = require('fs');

const rabPath = 'src/app/actions/rab.ts';
let content = fs.readFileSync(rabPath, 'utf8');

const updateProfilePattern = /export async function updateFasilitatorProfile\(id: string, data: any\) \{/;
const updateProfileReplacement = `export async function updateFasilitatorProfile(id: string, data: any) {
  const { error: authError, session } = await checkAuth();
  if (authError || !session?.user) throw new Error('Unauthorized');

  const currentFasil = await prisma.fasilitator.findUnique({ where: { id } });
  
  // Security Check: Only ADMIN/SUPER_ADMIN or the fasilitator themselves can update their profile
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    if (currentFasil?.userId !== session.user.id) {
      throw new Error('Unauthorized: Anda tidak memiliki akses untuk mengubah profil fasilitator lain.');
    }
  }
`;

content = content.replace(updateProfilePattern, updateProfileReplacement);

fs.writeFileSync(rabPath, content);
console.log('Patched updateFasilitatorProfile security');
