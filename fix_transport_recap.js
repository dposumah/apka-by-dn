const fs = require('fs');

// 1. Fix portal client-page.tsx
const portalPath = 'src/app/(snt)/portal/client-page.tsx';
let portal = fs.readFileSync(portalPath, 'utf8');

portal = portal.replace(
  "const transportPending = fasilitator.laporan?.filter((l: any) => l.biayaTransport > 0 && l.statusTransport === 'PENDING').reduce((acc: number, curr: any) => acc + curr.biayaTransport, 0) || 0;",
  "const transportPending = fasilitator.laporan?.filter((l: any) => ((l.biayaTransport || 0) > 0 || (l.biayaTransportLaut || 0) > 0) && l.statusTransport === 'PENDING').reduce((acc: number, curr: any) => acc + (curr.biayaTransport || 0) + (curr.biayaTransportLaut || 0), 0) || 0;"
);

portal = portal.replace(
  "const transportLunas = fasilitator.laporan?.filter((l: any) => l.biayaTransport > 0 && l.statusTransport === 'PAID').reduce((acc: number, curr: any) => acc + curr.biayaTransport, 0) || 0;",
  "const transportLunas = fasilitator.laporan?.filter((l: any) => ((l.biayaTransport || 0) > 0 || (l.biayaTransportLaut || 0) > 0) && l.statusTransport === 'PAID').reduce((acc: number, curr: any) => acc + (curr.biayaTransport || 0) + (curr.biayaTransportLaut || 0), 0) || 0;"
);

fs.writeFileSync(portalPath, portal);
console.log('Fixed portal transport analytics');
