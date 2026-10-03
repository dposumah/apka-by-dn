const fs = require('fs');

let form = fs.readFileSync('src/app/(snt)/portal/laporan/client-form.tsx', 'utf8');

// Update function signature
form = form.replace(
  /export function LaporanClientForm\(\{ fasilitatorId, besaranTransport, defaultJPIntra = 8, defaultJPEkstra = 4 \}: \{ fasilitatorId: string, besaranTransport: number, defaultJPIntra\?: number, defaultJPEkstra\?: number \}\)/,
  'export function LaporanClientForm({ fasilitatorId, besaranTransport, jarakPPKm = 0, hargaPertamax = 13900, defaultJPIntra = 8, defaultJPEkstra = 4, jenisTugas = "INTRAKURIKULER" }: { fasilitatorId: string, besaranTransport: number, jarakPPKm?: number, hargaPertamax?: number, defaultJPIntra?: number, defaultJPEkstra?: number, jenisTugas?: string })'
);

// Define calculated transport based on formula
const transportVars = `
  const calculatedTransport = Math.round((jarakPPKm / 10) * hargaPertamax);
  const maxTransportDarat = Math.min(calculatedTransport, besaranTransport);
`;

form = form.replace(
  /const \[uploading, setUploading\] = useState\(false\)/,
  `const [uploading, setUploading] = useState(false)\n${transportVars}`
);

// Initial state of biayaTransport should be the maxTransportDarat (or calculatedTransport if we want them to see it)
// Let's set it to maxTransportDarat, since the formula says "Fasilitator bisa ketik manual namun jika melebihi rumus wajib mengisi bukti"
form = form.replace(
  /biayaTransport: '',/,
  `biayaTransport: maxTransportDarat ? maxTransportDarat.toString() : '',`
);

// Logic inside handle file / submit
form = form.replace(
  /const nominalDarat = parseFloat\(formData\.biayaTransport\) \|\| 0\n      if \(nominalDarat > besaranTransport && !buktiDarat\) \{/,
  `const nominalDarat = parseFloat(formData.biayaTransport) || 0\n      if (nominalDarat > maxTransportDarat && !buktiDarat) {`
);

form = form.replace(
  /setFileError\(\`Bukti Transport Darat wajib diunggah jika melebihi Rp \$\{besaranTransport\.toLocaleString\('id-ID'\)\}\.\`\)/,
  'setFileError(`Bukti Transport Darat wajib diunggah jika klaim melebihi nilai wajar rumus jarak (Rp ${maxTransportDarat.toLocaleString(\'id-ID\')}).`)'
);

// Logic for isDaratWajib
form = form.replace(
  /const isDaratWajib = nominalDaratCurrent > besaranTransport/,
  'const isDaratWajib = nominalDaratCurrent > maxTransportDarat'
);

// Logic for UI rendering
form = form.replace(
  /<p className="text-xs text-slate-500">Batas tanpa bukti: Rp \{besaranTransport\.toLocaleString\('id-ID'\)\}<\/p>/,
  '<p className="text-xs text-slate-500">Batas wajar sesuai jarak: Rp {maxTransportDarat.toLocaleString(\'id-ID\')}</p>'
);

form = form.replace(
  /\? \`Nominal Rp \$\{nominalDaratCurrent\.toLocaleString\('id-ID'\)\} melebihi batas Rp \$\{besaranTransport\.toLocaleString\('id-ID'\)\}\. Wajib lampirkan bukti \(nota BBM, tiket, dll\)\.\`/,
  '? `Nominal Rp ${nominalDaratCurrent.toLocaleString(\'id-ID\')} melebihi batas wajar jarak Rp ${maxTransportDarat.toLocaleString(\'id-ID\')}. Wajib lampirkan bukti BBM/Transportasi.`'
);

form = form.replace(
  /: \`Nominal di bawah batas Rp \$\{besaranTransport\.toLocaleString\('id-ID'\)\}\. Upload opsional, tapi disarankan\.\`/,
  ': `Nominal sesuai dengan nilai wajar jarak. Upload bukti opsional, tapi disarankan.`'
);

fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', form);
console.log('Fixed portal client form for transport logic');
