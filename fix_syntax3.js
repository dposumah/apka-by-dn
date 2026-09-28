const fs = require('fs');
let c = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

c = c.replace(/console\.error\(`Error in \$\{generateKwitansiHonor\}:`, error\);/g, "console.error('Error in generateKwitansiHonor:', error);");
c = c.replace(/`Unknown error in \$\{generateKwitansiHonor\}`/g, "'Unknown error in generateKwitansiHonor'");

c = c.replace(/console\.error\(`Error in \$\{generateKwitansiTransportBulanan\}:`, error\);/g, "console.error('Error in generateKwitansiTransportBulanan:', error);");
c = c.replace(/`Unknown error in \$\{generateKwitansiTransportBulanan\}`/g, "'Unknown error in generateKwitansiTransportBulanan'");

c = c.replace(/console\.error\(`Error in \$\{generateKwitansiExpense\}:`, error\);/g, "console.error('Error in generateKwitansiExpense:', error);");
c = c.replace(/`Unknown error in \$\{generateKwitansiExpense\}`/g, "'Unknown error in generateKwitansiExpense'");

fs.writeFileSync('src/app/actions/rekap.ts', c);
