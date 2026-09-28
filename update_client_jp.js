const fs = require('fs');
let c = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// 1. Add new state variables after manualJP
c = c.replace(
  "const [manualJP, setManualJP] = useState('')",
  "const [manualJP, setManualJP] = useState('')\n  const [manualJPIntra, setManualJPIntra] = useState('')\n  const [manualJPEkstra, setManualJPEkstra] = useState('')"
);

// 2. Update auto-calculate to use JPIntra + JPEkstra for total
c = c.replace(
  /useEffect\(\(\) => \{\s*\/\/ Auto calculate if JP changes\s*const jp = parseInt\(manualJP\) \|\| 0\s*const rate = parseInt\(manualRate\) \|\| 0\s*setManualHonor\(\(jp \* rate\)\.toString\(\)\)\s*\}, \[manualJP, manualRate\]\)/,
  `useEffect(() => {
    // Auto calculate total JP from Intra + Ekstra
    const jpIntra = parseInt(manualJPIntra) || 0
    const jpEkstra = parseInt(manualJPEkstra) || 0
    const totalJP = jpIntra + jpEkstra
    setManualJP(totalJP.toString())
    const rate = parseInt(manualRate) || 0
    setManualHonor((totalJP * rate).toString())
  }, [manualJPIntra, manualJPEkstra, manualRate])`
);

// 3. Update the auto-calculate based on jenis (set JPIntra or JPEkstra)
c = c.replace(
  /const defaultJP = manualJenis === 'INTRAKURIKULER' \? \(f\.defaultJPIntra \|\| 8\) : \(f\.defaultJPEkstra \|\| 4\)\s*const sesi = parseInt\(manualSesi\) \|\| 4\s*setManualJP\(\(defaultJP \* sesi\)\.toString\(\)\)/,
  `const sesi = parseInt(manualSesi) || 4
        const jpIntra = (f.defaultJPIntra || 8) * sesi
        const jpEkstra = (f.defaultJPEkstra || 4) * sesi
        setManualJPIntra(jpIntra.toString())
        setManualJPEkstra(jpEkstra.toString())`
);

// 4. Update createRekapManual call to pass JP Intra/Ekstra
c = c.replace(
  "await createRekapManual(manualFasilId, manualBulan, parseInt(manualJP) || 0, parseInt(manualHonor) || 0, parseInt(manualSesi) || 4)",
  "await createRekapManual(manualFasilId, manualBulan, parseInt(manualJP) || 0, parseInt(manualHonor) || 0, parseInt(manualSesi) || 4, parseInt(manualJPIntra) || 0, parseInt(manualJPEkstra) || 0)"
);

// 5. Reset JP Intra/Ekstra on form submit
c = c.replace(
  "setManualJP('')\n      setManualHonor('')",
  "setManualJP('')\n      setManualJPIntra('')\n      setManualJPEkstra('')\n      setManualHonor('')"
);

// 6. Replace the single JP input field with Intra + Ekstra + Total (read-only)
c = c.replace(
  /<input type="number" min="0" required className="w-full border rounded p-2" value=\{manualJP\} onChange=\{e => setManualJP\(e\.target\.value\)\} \/>/,
  `<div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-500">JP Intra</label>
                      <input type="number" min="0" className="w-full border rounded p-2" value={manualJPIntra} onChange={e => setManualJPIntra(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">JP Ekstra</label>
                      <input type="number" min="0" className="w-full border rounded p-2" value={manualJPEkstra} onChange={e => setManualJPEkstra(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Total JP</label>
                      <input type="number" readOnly className="w-full border rounded p-2 bg-slate-100" value={manualJP} />
                    </div>
                  </div>`
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', c);
console.log('Done updating client-page.tsx');
