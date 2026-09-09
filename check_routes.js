const http = require('http');

const routes = [
  '/',
  '/dashboard-rab',
  '/fasilitator',
  '/fasilitator/rekap-honor',
  '/fasilitator/transport',
  '/portal/laporan'
];

async function checkRoutes() {
  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:3000${route}`);
      console.log(`${route}: ${res.status}`);
      if (res.status === 500) {
        const text = await res.text();
        console.log(`Error on ${route}: ${text.substring(0, 200)}`);
      }
    } catch (e) {
      console.log(`${route}: Error ${e.message}`);
    }
  }
}
checkRoutes();
