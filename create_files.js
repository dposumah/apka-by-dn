const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\ASUS\\Documents\\APPProject\\BIGproject\\Akuntansi\\apka\\src';

const files = [
  {
    path: 'app/(dashboard)/inventori/page.tsx',
    content: `import { redirect } from 'next/navigation';\n\nexport default function InventoriPage() {\n  redirect('/inventori/produk');\n}\n`
  },
  {
    path: 'app/(dashboard)/bank/page.tsx',
    content: `import { redirect } from 'next/navigation';\n\nexport default function BankPage() {\n  redirect('/bank/akun');\n}\n`
  },
  {
    path: 'app/(dashboard)/bank/akun/page.tsx',
    content: `'use client';\nimport React from 'react';\n\nexport default function BankAkunPage() {\n  return <div className="p-6"><h1>Daftar Akun Bank</h1></div>;\n}\n`
  },
  {
    path: 'app/(dashboard)/bank/transaksi/page.tsx',
    content: `'use client';\nimport React from 'react';\n\nexport default function BankTransaksiPage() {\n  return <div className="p-6"><h1>Transaksi Bank</h1></div>;\n}\n`
  },
  {
    path: 'app/(dashboard)/bank/rekonsiliasi/page.tsx',
    content: `'use client';\nimport React from 'react';\n\nexport default function RekonsiliasiPage() {\n  return <div className="p-6"><h1>Rekonsiliasi Bank</h1></div>;\n}\n`
  },
  {
    path: 'app/(dashboard)/pajak/page.tsx',
    content: `'use client';\nimport React from 'react';\n\nexport default function PajakPage() {\n  return <div className="p-6"><h1>Ringkasan Pajak</h1></div>;\n}\n`
  },
  {
    path: 'app/(dashboard)/anggaran/page.tsx',
    content: `'use client';\nimport React from 'react';\n\nexport default function AnggaranPage() {\n  return <div className="p-6"><h1>Daftar Anggaran</h1></div>;\n}\n`
  },
  {
    path: 'app/(dashboard)/anggaran/baru/page.tsx',
    content: `'use client';\nimport React from 'react';\n\nexport default function AnggaranBaruPage() {\n  return <div className="p-6"><h1>Buat Anggaran Baru</h1></div>;\n}\n`
  },
  {
    path: 'app/(dashboard)/anggaran/[id]/page.tsx',
    content: `'use client';\nimport React from 'react';\n\nexport default function DetailAnggaranPage() {\n  return <div className="p-6"><h1>Detail Anggaran</h1></div>;\n}\n`
  },
  {
    path: 'app/api/bank-accounts/route.ts',
    content: `import { NextResponse } from 'next/server';\n\nexport async function GET() { return NextResponse.json([]); }\nexport async function POST() { return NextResponse.json({}); }\n`
  },
  {
    path: 'app/api/bank-accounts/[id]/route.ts',
    content: `import { NextResponse } from 'next/server';\n\nexport async function GET() { return NextResponse.json({}); }\nexport async function PUT() { return NextResponse.json({}); }\nexport async function DELETE() { return NextResponse.json({ success: true }); }\n`
  },
  {
    path: 'app/api/bank-transactions/route.ts',
    content: `import { NextResponse } from 'next/server';\n\nexport async function GET() { return NextResponse.json([]); }\nexport async function POST() { return NextResponse.json({}); }\n`
  },
  {
    path: 'app/api/reconciliation/route.ts',
    content: `import { NextResponse } from 'next/server';\n\nexport async function POST() { return NextResponse.json({ success: true }); }\n`
  },
  {
    path: 'app/api/tax/route.ts',
    content: `import { NextResponse } from 'next/server';\n\nexport async function GET() { return NextResponse.json([]); }\n`
  },
  {
    path: 'app/api/tax/transactions/route.ts',
    content: `import { NextResponse } from 'next/server';\n\nexport async function GET() { return NextResponse.json([]); }\nexport async function POST() { return NextResponse.json({}); }\n`
  },
  {
    path: 'app/api/budgets/route.ts',
    content: `import { NextResponse } from 'next/server';\n\nexport async function GET() { return NextResponse.json([]); }\nexport async function POST() { return NextResponse.json({}); }\n`
  },
  {
    path: 'app/api/budgets/[id]/route.ts',
    content: `import { NextResponse } from 'next/server';\n\nexport async function GET() { return NextResponse.json({}); }\nexport async function PUT() { return NextResponse.json({}); }\nexport async function DELETE() { return NextResponse.json({ success: true }); }\n`
  }
];

files.forEach(file => {
  const fullPath = path.join(srcDir, file.path);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, file.content);
  console.log('Created:', fullPath);
});
