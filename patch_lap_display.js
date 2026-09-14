const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', 'utf8');

// Fix the table display
const oldDisplay = `<div className="font-medium">{formatCurrency((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0))}</div>`;
const newDisplay = `<div className="font-medium">{formatCurrency((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0))}</div>
                            <div className="text-[10px] text-slate-500 mt-1 flex flex-col items-end">
                              {(lap.biayaTransport || 0) > 0 && <span>Darat: {formatCurrency(lap.biayaTransport)}</span>}
                              {(lap.biayaTransportLaut || 0) > 0 && <span>Laut: {formatCurrency(lap.biayaTransportLaut)}</span>}
                            </div>`;
code = code.replace(oldDisplay, newDisplay);

// Fix the print invoice html
const oldHtmlTr = `<td>Rp \${lap.biayaTransport.toLocaleString('id-ID')}</td>`;
const newHtmlTr = `<td>Rp \${((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')} <br/><small>(Darat: \${(lap.biayaTransport || 0).toLocaleString('id-ID')} | Laut: \${(lap.biayaTransportLaut || 0).toLocaleString('id-ID')})</small></td>`;
code = code.replace(oldHtmlTr, newHtmlTr);

const oldTotalTr = `<td class="total text-emerald-600">Rp \${lap.biayaTransport.toLocaleString('id-ID')}</td>`;
const newTotalTr = `<td class="total text-emerald-600">Rp \${((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')}</td>`;
code = code.replace(oldTotalTr, newTotalTr);

fs.writeFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', code);
console.log('Fixed laporan client page');
