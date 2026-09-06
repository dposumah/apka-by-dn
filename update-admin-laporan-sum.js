const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', 'utf8')

const targetSum = `{lap.biayaTransport > 0 ? (
                        <>
                          <div className="font-medium">{formatCurrency(lap.biayaTransport)}</div>`
                          
const replaceSum = `{(lap.biayaTransport || 0) > 0 || (lap.biayaTransportLaut || 0) > 0 ? (
                        <>
                          <div className="font-medium">{formatCurrency((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0))}</div>`
                          
code = code.replace(targetSum, replaceSum)

// Also fix the button logic for Cetak Invoice Transport
const targetBtn = `{lap.biayaTransport > 0 && lap.statusTransport === 'PENDING' && (`
const replaceBtn = `{((lap.biayaTransport || 0) > 0 || (lap.biayaTransportLaut || 0) > 0) && lap.statusTransport === 'PENDING' && (`

code = code.replace(targetBtn, replaceBtn)

fs.writeFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', code)
