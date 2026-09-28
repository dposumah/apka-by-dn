const fs = require('fs');
let content = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf-8');

const oldEffect = `  useEffect(() => {
    // Auto calculate if JP changes
    const jp = parseInt(manualJP) || 0
    const rate = parseInt(manualRate) || 0
    setManualHonor((jp * rate).toString())
  }, [manualJP, manualRate])`;

const newEffect = `  useEffect(() => {
    // Auto calculate JP based on type and fasilitator config
    if (manualFasilId) {
      const f = fasilitators.find((x: any) => x.id === manualFasilId)
      if (f) {
        const defaultJP = manualJenis === 'INTRAKURIKULER' ? (f.defaultJPIntra || 8) : (f.defaultJPEkstra || 4)
        const sesi = parseInt(manualSesi) || 4
        setManualJP((defaultJP * sesi).toString())
      }
    }
  }, [manualJenis, manualFasilId, manualSesi, fasilitators])

  useEffect(() => {
    // Auto calculate if JP changes
    const jp = parseInt(manualJP) || 0
    const rate = parseInt(manualRate) || 0
    setManualHonor((jp * rate).toString())
  }, [manualJP, manualRate])`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', content);
