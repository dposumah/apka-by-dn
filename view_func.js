const fs = require('fs');
const code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

const start = code.indexOf('export async function updateFasilitatorProfile');
const end = code.indexOf('export async function submitLaporanKegiatan');

console.log(code.substring(start, end));
