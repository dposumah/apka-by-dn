const fs = require('fs');
let c = fs.readFileSync('src/app/(snt)/portal/laporan/client-form.tsx', 'utf8');

c = c.replace(
  /export function LaporanClientForm\(\{ fasilitatorId, besaranTransport, defaultJPIntra, defaultJPEkstra, jenisTugas = "INTRAKURIKULER" \}: \{ fasilitatorId: string, besaranTransport: number, defaultJPIntra: number, defaultJPEkstra: number, jenisTugas\?: string \}\) \{/,
  'export function LaporanClientForm({ fasilitatorId, besaranTransport, defaultJPIntra, defaultJPEkstra, jenisTugas = "INTRAKURIKULER" }: { fasilitatorId: string, besaranTransport: number, defaultJPIntra?: number, defaultJPEkstra?: number, jenisTugas?: string }) {'
);

fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', c);
console.log('Fixed');
