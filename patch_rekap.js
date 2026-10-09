const fs = require('fs');

const rekapPath = 'src/app/actions/rekap.ts';
let content = fs.readFileSync(rekapPath, 'utf8');

// The replacement logic:
const authCheckCode = `
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized: Anda harus login untuk melakukan aksi ini." };
`;

// Replace for generateKwitansiExpense
const kwtExpPattern = /export async function generateKwitansiExpense\(expenseId: string, inputNoUrut\?: string, inputTanggal\?: string\) \{\s*try \{/g;
content = content.replace(kwtExpPattern, `export async function generateKwitansiExpense(expenseId: string, inputNoUrut?: string, inputTanggal?: string) {\n  try {${authCheckCode}`);

// Replace for generateKwitansiTransportBulanan
const transBulPattern = /export async function generateKwitansiTransportBulanan\(rekapId: string, inputNoUrut\?: string, inputTanggal\?: string\) \{\s*try \{/g;
content = content.replace(transBulPattern, `export async function generateKwitansiTransportBulanan(rekapId: string, inputNoUrut?: string, inputTanggal?: string) {\n  try {${authCheckCode}`);

// Replace for generateInvoiceExpense
const invExpPattern = /export async function generateInvoiceExpense\(expenseId: string, inputNoUrut\?: string, inputTanggal\?: string\) \{\s*try \{/g;
content = content.replace(invExpPattern, `export async function generateInvoiceExpense(expenseId: string, inputNoUrut?: string, inputTanggal?: string) {\n  try {${authCheckCode}`);

// Replace for generateKwitansiHonor
const kwtHonorPattern = /export async function generateKwitansiHonor\(rekapId: string, inputNoUrut\?: string, inputTanggal\?: string\) \{\s*try \{/g;
content = content.replace(kwtHonorPattern, `export async function generateKwitansiHonor(rekapId: string, inputNoUrut?: string, inputTanggal?: string) {\n  try {${authCheckCode}`);

fs.writeFileSync(rekapPath, content);
console.log('Patched rekap.ts webhook trigger security');
