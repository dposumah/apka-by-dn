const fs = require('fs')

let path = 'src/app/(snt)/fasilitator/laporan/client-page.tsx'
let code = fs.readFileSync(path, 'utf8')

// Fix JP & Topic undefined
code = code.replace(
  /\$\{lap\.topic\} - \$\{lap\.jenisKegiatan\}/g,
  "${lap.topic}"
)

code = code.replace(
  /<td>\$\{lap\.jumlahJP\}<\/td>/g,
  "<td>${(lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0)}</td>"
)

// Move Informasi Transfer
const oldHeader = `              </div>
              <div style="text-align: right; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc;">
                <h4 style="margin:0 0 10px 0;">Informasi Transfer</h4>
                <p style="margin:5px 0;"><strong>Bank:</strong> \${lap.fasilitator.bankName || '-'}</p>
                <p style="margin:5px 0;"><strong>No. Rekening:</strong> \${lap.fasilitator.bankAccount || '-'}</p>
                <p style="margin:5px 0;"><strong>A/N:</strong> \${lap.fasilitator.namaLengkap}</p>
              </div>
            </div>`

const newHeader = `              </div>
            </div>`

const oldFooter = `            </table>
            
            <div style="margin-top: 50px; text-align: right; font-size: 0.9em; color: #555;">
              <p>Dicetak oleh: Admin SNT</p>
            </div>`

const newFooter = `            </table>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc; min-width: 250px;">
                <h4 style="margin:0 0 10px 0;">Informasi Transfer Fasilitator</h4>
                <p style="margin:5px 0;"><strong>Bank:</strong> \${lap.fasilitator.bankName || '-'}</p>
                <p style="margin:5px 0;"><strong>No. Rekening:</strong> \${lap.fasilitator.bankAccount || '-'}</p>
                <p style="margin:5px 0;"><strong>A/N:</strong> \${lap.fasilitator.namaLengkap}</p>
              </div>
              <div style="text-align: right; font-size: 0.9em; color: #555; padding-top: 15px;">
                <p>Dicetak oleh: Admin SNT</p>
              </div>
            </div>`

code = code.replace(oldHeader, newHeader)
code = code.replace(oldFooter, newFooter)

fs.writeFileSync(path, code)
