const fs = require('fs')
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

// Fix createFasilitator
code = code.replace(
  'besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : 120000,',
  'besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : 120000,'
)

// Fix updateFasilitatorProfile
// I need to use regex to find the second occurrence and replace it
const replaceUpdate = `besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : currentFasil.besaranTransport,`

code = code.replace(
  /export async function updateFasilitatorProfile[\s\S]*?besaranTransport: data\.besaranTransport !== undefined \? parseFloat\(data\.besaranTransport\) : 120000,/g,
  match => match.replace("120000,", "currentFasil?.besaranTransport ?? 120000,")
)

fs.writeFileSync('src/app/actions/rab.ts', code)
