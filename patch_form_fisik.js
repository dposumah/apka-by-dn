const fs = require('fs');
const filePath = 'src/app/(snt)/portal/laporan/client-form.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add state
code = code.replace(/const \[foto2, setFoto2\] = useState\(''\)/, "const [foto2, setFoto2] = useState('')\n    const [fileLaporanFisik, setFileLaporanFisik] = useState('')");

// Add parameter to handleFileChange
code = code.replace(/field: 'foto1' \| 'foto2'/, "field: 'foto1' | 'foto2' | 'fileLaporanFisik'");

// Add assignment to handleFileChange
code = code.replace(/if \(field === 'foto2'\) setFoto2\(url\)/, "if (field === 'foto2') setFoto2(url)\n        if (field === 'fileLaporanFisik') setFileLaporanFisik(url)");

// Include in submitLaporanKegiatan
code = code.replace(/foto1,\s*foto2\n\s*\}/, "foto1,\n          foto2,\n          fileLaporanFisik\n        }");

// Add File Input Field and Download Link in UI
const uiAddition = `
              <div className="space-y-2 border border-slate-200 bg-slate-50 p-4 rounded-md mt-4">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-semibold">Laporan Fisik (Berita Acara / Laporan)</Label>
                  <a href="/templates/Template_Laporan_Fisik_Fasilitator.docx" download className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    Download Template
                  </a>
                </div>
                <Input type="file" onChange={(e) => handleFileChange(e, 'fileLaporanFisik')} accept=".pdf,.doc,.docx" />
                {fileLaporanFisik && <p className="text-xs text-emerald-600">Laporan fisik terlampir.</p>}
                <p className="text-xs text-slate-500">Silakan unduh template, isi, tanda tangani, lalu unggah kembali di sini (Bisa PDF/Word).</p>
              </div>
`;

code = code.replace(/<div className="space-y-4 border-t pt-4 mt-2">/, uiAddition + '\n              <div className="space-y-4 border-t pt-4 mt-2">');

fs.writeFileSync(filePath, code);
