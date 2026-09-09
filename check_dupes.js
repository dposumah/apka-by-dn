const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Starting duplicate check...');
    const allSiswa = await prisma.siswa.findMany();
    console.log('Total Siswa:', allSiswa.length);
    const duplicates = [];
    const seen = new Set();
    
    for (const s of allSiswa) {
        const key = s.namaLengkap.toLowerCase().trim() + '-' + s.lokasiSNT.toLowerCase().trim();
        if (seen.has(key)) {
            duplicates.push(s);
        } else {
            seen.add(key);
        }
    }
    console.log('Duplicates found:', duplicates.length);
    
    if (duplicates.length > 0) {
        console.log('Removing duplicates...');
        for (const d of duplicates) {
            await prisma.kehadiranEkstra.deleteMany({ where: { siswaId: d.id } });
            await prisma.siswa.delete({ where: { id: d.id } });
        }
        console.log('Duplicates removed.');
    }
}
main().catch(console.error);
