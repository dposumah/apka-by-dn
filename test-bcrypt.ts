import * as bcrypt from 'bcryptjs'

async function test() {
  const adminHash = '.umTjGYGtbbt9zzzPrmfRUBNKHsa.3wi'
  const fasilHash = '.ajHL5d7vwqXeFJ2Fub.jB22YXMgQnF/8xiSaxEwPd20KijG/cC'
  console.log('Admin password123:', await bcrypt.compare('password123', adminHash))
  console.log('Fasil password123:', await bcrypt.compare('password123', fasilHash))
  console.log('Fasil password:', await bcrypt.compare('password', fasilHash))
  console.log('Fasil SNT2026:', await bcrypt.compare('SNT2026', fasilHash))
  console.log('Fasil fasilitator123:', await bcrypt.compare('fasilitator123', fasilHash))
}
test()
