const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', 'utf8');
page = page.replace("import { useState } from 'react'", "import React, { useState } from 'react'");
fs.writeFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', page);
