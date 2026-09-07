const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mapping = {
  "Jambi - Kab. Tanjung Jabung Timur": "Kabupaten Tanjung Jabung Timur, Jambi - Desa Suka Majuk, Kecamatan Geragai",
  "Jambi - Kab. Tebo": "Kabupaten Tebo, Jambi - Komplek Perkantoran Seentak Galah Serengkuh Dayung, Jl. Lintas Tebo-Bungo Km. 12, Muara Tebo (37571)",
  "Sulawesi Tenggara - Kab. Buton Tengah": "Kabupaten Buton Tengah, Sulawesi Tenggara - Kampus B USN Kolaka, Jl. Poros Mawasangka-Wakambangura II, Desa Wakambangura, Kecamatan Mawasangka",
  "Sulawesi Utara - Kab. Minahasa Utara": "Kabupaten Minahasa, Sulawesi Utara - BPMP Sulawesi Utara, Jl. Raya Manado-Tomohon, Pineleng II, Kecamatan Pineleng",
  "Nusa Tenggara Timur - Kab. Kupang": "Kabupaten Kupang, Nusa Tenggara Timur - Jl. Nasional Trans-Timor No. KM 36, Naibonat, Kecamatan Kupang Timur (85362)",
  "Maluku Utara - Kota Tidore Kepulauan": "Kota Tidore Kepulauan, Maluku Utara - Gedung BPMP Maluku Utara, Kecamatan Tidore Utara"
};

async function main() {
  const fasils = await prisma.fasilitator.findMany();
  for (const f of fasils) {
    if (f.lokasiSNT && mapping[f.lokasiSNT]) {
      await prisma.fasilitator.update({
        where: { id: f.id },
        data: { lokasiSNT: mapping[f.lokasiSNT] }
      });
      console.log(`Updated ${f.id} to ${mapping[f.lokasiSNT]}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
