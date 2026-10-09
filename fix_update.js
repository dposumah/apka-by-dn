const fs = require('fs');
let content = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

// Insert into updateFasilitatorProfile
// Find "jenisTugas: data.jenisTugas || currentFasil?.jenisTugas || 'INTRAKURIKULER',"
// and prepend ktpUrl
content = content.replace(
  /jenisTugas: data\.jenisTugas \|\| currentFasil\?\.jenisTugas \|\| 'INTRAKURIKULER',/,
  'ktpUrl: data.ktpUrl !== undefined ? data.ktpUrl : undefined,\n      jenisTugas: data.jenisTugas || currentFasil?.jenisTugas || \'INTRAKURIKULER\','
);

fs.writeFileSync('src/app/actions/rab.ts', content);
