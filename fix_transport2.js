const fs = require('fs');
const portalPath = 'src/app/(snt)/portal/client-page.tsx';
let portal = fs.readFileSync(portalPath, 'utf8');

// Fix per-laporan transport display to include laut
portal = portal.replace(
  "{lap.biayaTransport > 0 && (\n                      <div className=\"flex justify-between md:justify-end items-center gap-4\">\n                        <span className=\"text-xs text-slate-500 uppercase tracking-wider font-semibold\">Transportasi</span>\n                        <div className=\"text-xs text-slate-700\">\n                          Rp {lap.biayaTransport.toLocaleString('id-ID')}",
  "{((lap.biayaTransport || 0) > 0 || (lap.biayaTransportLaut || 0) > 0) && (\n                      <div className=\"flex justify-between md:justify-end items-center gap-4\">\n                        <span className=\"text-xs text-slate-500 uppercase tracking-wider font-semibold\">Transportasi</span>\n                        <div className=\"text-xs text-slate-700\">\n                          Rp {((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')}"
);

fs.writeFileSync(portalPath, portal);
console.log('Fixed per-laporan transport display');
