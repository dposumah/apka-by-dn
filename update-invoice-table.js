const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', 'utf8')

// Modify table print logic
const targetTable = `            <table>
              <thead>
                <tr>
                  <th>Deskripsi / Topik</th>
                  <th>Tingkat</th>
                  <th>JP</th>
                  <th>Biaya Transport</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>\${lap.topic} - \${lap.jenisKegiatan}</td>
                  <td>\${lap.tingkatSekolah}</td>
                  <td>\${lap.jumlahJP}</td>
                  <td>Rp \${lap.biayaTransport.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td colspan="3" class="total">TOTAL TAGIHAN TRANSPORT:</td>
                  <td class="total text-emerald-600">Rp \${lap.biayaTransport.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>`

const replacementTable = `            <table>
              <thead>
                <tr>
                  <th>Rincian Transport</th>
                  <th>Deskripsi / Topik</th>
                  <th>Nominal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Transport Darat (Default)</td>
                  <td>\${lap.topic} - \${lap.jenisKegiatan}</td>
                  <td>Rp \${lap.biayaTransport.toLocaleString('id-ID')}</td>
                </tr>
                \${(lap.biayaTransportLaut || 0) > 0 ? \`
                <tr>
                  <td>Transport Laut (Antar Pulau)</td>
                  <td>Tiket / Bukti Pembayaran Terlampir di Sistem</td>
                  <td>Rp \${(lap.biayaTransportLaut || 0).toLocaleString('id-ID')}</td>
                </tr>\` : ''}
                <tr>
                  <td colspan="2" class="total">TOTAL TAGIHAN TRANSPORT:</td>
                  <td class="total" style="color: #059669;">Rp \${((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>`

code = code.replace(targetTable, replacementTable)
fs.writeFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', code)
