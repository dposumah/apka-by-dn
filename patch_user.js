const fs = require('fs');
const filePath = 'src/app/actions/user.ts';
let code = fs.readFileSync(filePath, 'utf8');

const newAction = `
export async function createKorwilUser(data: { name: string, email: string, password: string }) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return { error: "Email sudah digunakan" }

    const hashed = await bcrypt.hash(data.password, 10)
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: 'KORWIL'
      }
    })
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan server" }
  }
}
`;

code += newAction;
fs.writeFileSync(filePath, code);
console.log("Added createKorwilUser");
