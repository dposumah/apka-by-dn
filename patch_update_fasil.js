const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

const targetStr = "revalidatePath('/fasilitator')";

const injection = `
  // Recalculate pending transport darat if besaranTransport changed
  if (currentFasil && updated.besaranTransport !== currentFasil.besaranTransport) {
    const pendingReports = await prisma.laporanKegiatan.findMany({
      where: {
        fasilitatorId: id,
        statusTransport: 'PENDING',
        reqBiayaTransport: { not: null }
      },
      orderBy: { date: 'asc' }
    });

    if (pendingReports.length > 0) {
      // Group by week
      const weeklyGroups = {};
      
      for (const rep of pendingReports) {
        const d = new Date(rep.date);
        const dayOfWeek = d.getDay() || 7;
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - dayOfWeek + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        const weekKey = startOfWeek.getTime();
        
        if (!weeklyGroups[weekKey]) weeklyGroups[weekKey] = [];
        weeklyGroups[weekKey].push(rep);
      }

      for (const weekKey of Object.keys(weeklyGroups)) {
        const reps = weeklyGroups[weekKey];
        // Sort by date inside the week (earliest claim first)
        reps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let remaining = updated.besaranTransport;
        
        for (const rep of reps) {
          const req = rep.reqBiayaTransport || 0;
          let granted = Math.min(req, remaining);
          remaining = Math.max(0, remaining - granted);
          
          if (rep.biayaTransport !== granted) {
            await prisma.laporanKegiatan.update({
              where: { id: rep.id },
              data: { biayaTransport: granted }
            });
          }
        }
      }
    }
  }

  revalidatePath('/fasilitator')`;

code = code.replace(targetStr, injection);
fs.writeFileSync('src/app/actions/rab.ts', code);
console.log('Patched updateFasilitatorProfile');
