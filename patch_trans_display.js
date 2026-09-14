const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/transport/client-page.tsx', 'utf8');

const oldDisplay = `<div className="font-semibold text-blue-700">Rp {((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')}</div>`;
const newDisplay = `<div className="font-semibold text-blue-700">Rp {((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex flex-col items-end font-medium">
                      {(lap.biayaTransport || 0) > 0 && <span>Darat: Rp {(lap.biayaTransport || 0).toLocaleString('id-ID')}</span>}
                      {(lap.biayaTransportLaut || 0) > 0 && <span>Laut: Rp {(lap.biayaTransportLaut || 0).toLocaleString('id-ID')}</span>}
                    </div>`;

code = code.replace(oldDisplay, newDisplay);
fs.writeFileSync('src/app/(snt)/fasilitator/transport/client-page.tsx', code);
console.log('Fixed transport client page');
