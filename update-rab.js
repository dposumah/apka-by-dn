const fs = require('fs')
let content = fs.readFileSync('src/app/actions/rab.ts', 'utf8')
const newFunc = fs.readFileSync('new_func.txt', 'utf8')

const oldFuncRegex = /export async function updateFasilitatorProfile\(id: string, data: any\) \{[\s\S]*?return updated\r?\n\}/;

content = content.replace(oldFuncRegex, newFunc)
fs.writeFileSync('src/app/actions/rab.ts', content)
