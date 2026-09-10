const fs = require('fs');
const filePath = 'src/app/(snt)/portal/laporan/client-form.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const target1 = '<Label className="text-sm font-semibold">Laporan Fisik</Label>';
const replacement1 = '<Label className="text-sm font-semibold">Laporan Fisik <span className="text-slate-500 font-normal">(Opsional - Bisa dilengkapi menyusul)</span></Label>';

code = code.replace(target1, replacement1);

const target2 = 'Silakan unduh template, isi, tanda tangani, simpan sebagai PDF, lalu unggah kembali di sini (Maksimal 2 MB).';
const replacement2 = 'Silakan unduh template, isi, tanda tangani, simpan sebagai PDF, lalu unggah kembali di sini (Maksimal 2 MB). Jika belum selesai, Anda dapat melewati ini dan mengunggahnya nanti.';

code = code.replace(target2, replacement2);

fs.writeFileSync(filePath, code);
console.log('Updated Laporan Fisik label in client-form.tsx');
