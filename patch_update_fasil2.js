const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

// First undo the previous patch by replacing it back with targetStr
const oldInjection = `
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

code = code.replace(oldInjection, "revalidatePath('/fasilitator')");

const newInjection = `
  // Recalculate pending transport darat if besaranTransport changed
  if (currentFasil && updated.besaranTransport !== currentFasil.besaranTransport) {
    // Get distinct weeks that have PENDING reports
    const pendingReports = await prisma.laporanKegiatan.findMany({
      where: {
        fasilitatorId: id,
        statusTransport: 'PENDING',
        reqBiayaTransport: { not: null }
      }
    });

    if (pendingReports.length > 0) {
      const weeksToRecalc = new Set<number>();
      for (const rep of pendingReports) {
        const d = new Date(rep.date);
        const dayOfWeek = d.getDay() || 7;
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - dayOfWeek + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        weeksToRecalc.add(startOfWeek.getTime());
      }

      // For each week, calculate remaining budget and update PENDING reports
      for (const weekTime of weeksToRecalc) {
        const startOfWeek = new Date(weekTime);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Fetch ALL reports in this week
        const allReps = await prisma.laporanKegiatan.findMany({
          where: {
            fasilitatorId: id,
            date: { gte: startOfWeek, lte: endOfWeek }
          },
          orderBy: { date: 'asc' }
        });

        let remaining = updated.besaranTransport || 0;

        for (const rep of allReps) {
          if (rep.statusTransport !== 'PENDING') {
             // Deduct already paid amounts
             remaining -= (rep.biayaTransport || 0);
             remaining = Math.max(0, remaining);
          } else if (rep.reqBiayaTransport != null) {
             // It's a pending report, recalculate it
             const req = rep.reqBiayaTransport;
             let granted = Math.min(req, remaining);
             
             // Check if there's an earlier report on the same day that got granted
             const sameDayReps = allReps.filter(r => new Date(r.date).toDateString() === new Date(rep.date).toDateString());
             const earlierGranted = sameDayReps.find(r => r.id !== rep.id && new Date(r.createdAt) < new Date(rep.createdAt) && (r.biayaTransport || 0) > 0);
             if (earlierGranted) {
               granted = 0; // max 1 per day
             }
             
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
  }

  revalidatePath('/fasilitator')`;

code = code.replace("revalidatePath('/fasilitator')", newInjection);
fs.writeFileSync('src/app/actions/rab.ts', code);
console.log('Fixed updateFasilitatorProfile again');
