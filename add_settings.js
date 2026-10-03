const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

const settingsCode = `
// ==================== APP SETTINGS ====================

export async function getAppSetting(key: string, defaultValue: string) {
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  return setting ? setting.value : defaultValue;
}

export async function updateAppSetting(key: string, value: string, label?: string) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) throw new Error(authError);

  const setting = await prisma.appSetting.upsert({
    where: { key },
    update: { value, label: label || null },
    create: { key, value, label: label || null }
  });
  revalidatePath('/snt-akun');
  return setting;
}
`;

if (!code.includes('updateAppSetting')) {
  code += settingsCode;
  fs.writeFileSync('src/app/actions/rab.ts', code);
}
console.log('Added app settings actions');
