const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const updates = [
  { match: "Iis Hamsir", pangkat: "Iva / Pembina", alamat: "Cungkuk Kidul, Kel. Margorejo, Kec. Tempel, Kab. Sleman" },
  { match: "Riva Alvi", pangkat: "Penata Tkt I / IIId", alamat: "Perum GPI, Jl. Lengkeng 10 No. 44, Kec. Mapanget, Kota Manado" },
  { match: "Almido", pangkat: "Penata Tingkat I / IIId", alamat: "Jalan Adisucipto Penfui" },
  { match: "Don Ebn-Azar", pangkat: "Penata Tk. I/ III D", alamat: "Fak. Sains dan Teknik Undana, Jl. Adisucipto, Penfui" },
  { match: "Samy Yeverson", pangkat: "Penata Tk.1 / IIId", alamat: "Jln. Adisucipto Penfui" },
  { match: "Hendrik Jeheskial", pangkat: "Penata Tk.1/IIIB", alamat: "Jl. Adi Sucipto Penfui" },
  { match: "Evtaleny", pangkat: "Lektor", alamat: "Fak. Sains dan Teknik Undana, Jl. Adisucipto, Penfui" },
  { match: "Rando", pangkat: "Dosen", alamat: "Baubau, Sulawesi Tenggara" },
  { match: "Cahyana", pangkat: "Tenaga Ahli Programmer", alamat: "Jambi, Indonesia" },
  { match: "Chindra", pangkat: "Dosen", alamat: "De Permata G 17 Kenali Asam Atas Jambi" },
  { match: "Iriany", pangkat: "Pembina Utama/IV/c", alamat: "Jl Inpres Ubo-Ubo Ternate Selatan" },
  { match: "Nico Indra", pangkat: "Pembina /IV.a", alamat: "Jl. Patimura Wirotho Agung, Rimbo Bujang, Kab. Tebo" },
  { match: "Rocky", pangkat: "Guru PNS", alamat: "Karombasan Selatan, Ling III, Kec. Wanea. Kota Manado" },
  { match: "Muliyadi", pangkat: "Lektor", alamat: "Desa Matara, Kec. Mawsangka, Buton Tengah" }
]

async function main() {
  const fasils = await prisma.fasilitator.findMany()
  
  for (const update of updates) {
    const f = fasils.find(x => x.namaLengkap.toLowerCase().includes(update.match.toLowerCase()))
    if (f) {
      await prisma.fasilitator.update({
        where: { id: f.id },
        data: {
          pangkatGolongan: update.pangkat,
          alamat: update.alamat
        }
      })
      console.log(`Updated: ${f.namaLengkap}`)
    } else {
      console.log(`NOT FOUND: ${update.match}`)
    }
  }
}
main()
