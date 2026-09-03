import { compare } from 'bcryptjs'

async function test() {
  const oldHash = '.ajHL5d7vwqXeFJ2Fub.jB22YXMgQnF/8xiSaxEwPd20KijG/cC'
  const passwords = ['admin123', 'fasilitator123', '12345678', 'password', 'SNT2026', 'apka2024', 'Fasilitator', 'Fasilitator123']
  for (const p of passwords) {
    if (await compare(p, oldHash)) {
      console.log('Found:', p)
      return
    }
  }
  console.log('Not found')
}
test()
