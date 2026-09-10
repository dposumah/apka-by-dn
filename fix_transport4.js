const fs = require('fs');

// Fix dashboard-rab
const dashPath = 'src/app/(snt)/dashboard-rab/page.tsx';
let dash = fs.readFileSync(dashPath, 'utf8');
dash = dash.replace(
  "{ statusTransport: 'PENDING', biayaTransport: { gt: 0 } }",
  "{ statusTransport: 'PENDING', OR: [{ biayaTransport: { gt: 0 } }, { biayaTransportLaut: { gt: 0 } }] }"
);
fs.writeFileSync(dashPath, dash);
console.log('Fixed dashboard-rab');

// Fix rekap.ts getAdminTransportRecap
const rekapPath = 'src/app/actions/rekap.ts';
let rekap = fs.readFileSync(rekapPath, 'utf8');
rekap = rekap.replace(
  "biayaTransport: { gt: 0 },\n      statusTransport: 'PENDING'",
  "statusTransport: 'PENDING',\n      OR: [{ biayaTransport: { gt: 0 } }, { biayaTransportLaut: { gt: 0 } }]"
);
fs.writeFileSync(rekapPath, rekap);
console.log('Fixed rekap.ts getAdminTransportRecap');
