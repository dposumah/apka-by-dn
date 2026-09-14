const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

// Inside submitLaporanKegiatan:
// reqBiayaTransport: reqTransportDarat,
// instead of just:
// biayaTransport: grantedTransportDarat,

const oldData = `jumlahJPIntra: reqJpIntra,
      jumlahJPEkstra: reqJpEkstra,
      biayaTransport: grantedTransportDarat,
      biayaTransportLaut: grantedTransportLaut,`;

const newData = `jumlahJPIntra: reqJpIntra,
      jumlahJPEkstra: reqJpEkstra,
      biayaTransport: grantedTransportDarat,
      reqBiayaTransport: reqTransportDarat,
      biayaTransportLaut: grantedTransportLaut,`;

code = code.replace(oldData, newData);
fs.writeFileSync('src/app/actions/rab.ts', code);
console.log('Fixed submitLaporanKegiatan to store reqBiayaTransport');
