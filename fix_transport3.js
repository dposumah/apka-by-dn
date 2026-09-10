const fs = require('fs');

// Fix admin transport page
const transportPath = 'src/app/(snt)/fasilitator/transport/client-page.tsx';
let transport = fs.readFileSync(transportPath, 'utf8');

// Fix total calculation
transport = transport.replace(
  "const totalAmount = initialData.reduce((sum, item) => sum + (item.biayaTransport || 0), 0)",
  "const totalAmount = initialData.reduce((sum, item) => sum + (item.biayaTransport || 0) + (item.biayaTransportLaut || 0), 0)"
);

// Fix per-row display
transport = transport.replace(
  "<td className=\"px-4 py-3 text-right font-semibold text-blue-700\">Rp {lap.biayaTransport.toLocaleString('id-ID')}</td>",
  "<td className=\"px-4 py-3 text-right font-semibold text-blue-700\">Rp {((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')}</td>"
);

fs.writeFileSync(transportPath, transport);
console.log('Fixed admin transport page');

// Fix admin header badge count
const headerPath = 'src/app/(snt)/header.tsx';
let header = fs.readFileSync(headerPath, 'utf8');
// The header already counts biayaTransport > 0, we need to also include biayaTransportLaut > 0
if (header.includes("biayaTransport: { gt: 0 }")) {
  header = header.replace(
    "biayaTransport: { gt: 0 }",
    "OR: [{ biayaTransport: { gt: 0 } }, { biayaTransportLaut: { gt: 0 } }]"
  );
  fs.writeFileSync(headerPath, header);
  console.log('Fixed header badge count');
}
